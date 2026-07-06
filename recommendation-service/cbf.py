import asyncio
import time

import asyncpg
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Materials rarely change — cache per topic_id for 5 minutes
_materials_cache: dict[int, tuple[list, float]] = {}
_MATERIALS_TTL = 300.0


class ContentBasedFilter:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def score(self, user_id: int, topic_id: int, weak_subtopics: list[str] = []) -> list[dict]:
        # Fetch weak tags and materials in parallel
        weak_tags, materials = await asyncio.gather(
            self._fetch_weak_tags(user_id, topic_id),
            self._fetch_materials(topic_id, weak_subtopics),
        )

        if not materials:
            return []

        texts     = [m["text_features"] for m in materials]
        query_str = " ".join(weak_tags) if weak_tags else texts[0]
        reason    = (
            f"Covers weak subtopics: {', '.join(weak_tags[:3])}"
            if weak_tags else
            "Introductory material for topic"
        )

        vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
        try:
            tfidf = vectorizer.fit_transform([query_str] + texts)
        except ValueError:
            return []

        sims = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()

        return [
            {
                "material_id": materials[i]["material_id"],
                "subtopic_id": materials[i]["subtopic_id"],
                "score":       float(sims[i]),
                "reason":      reason,
            }
            for i in range(len(materials))
        ]

    async def _fetch_weak_tags(self, user_id: int, topic_id: int) -> list[str]:
        rows = await self.pool.fetch(
            """
            SELECT DISTINCT q.topic_tag
            FROM student_answers sa
            JOIN questions      q  ON sa.question_id = q.question_id
            JOIN quiz_attempts  qa ON sa.attempt_id  = qa.attempt_id
            JOIN quizzes        qz ON qa.quiz_id      = qz.quiz_id
            WHERE qa.student_id  = $1
              AND qz.topic_id    = $2
              AND sa.is_correct  = FALSE
              AND q.topic_tag IS NOT NULL
            ORDER BY qa.submitted_at DESC
            LIMIT 10
            """,
            user_id, topic_id,
        )
        return [r["topic_tag"] for r in rows]

    async def _fetch_materials(self, topic_id: int, subtopics: list[str] = []) -> list[asyncpg.Record]:
        if subtopics:
            rows = await self.pool.fetch(
                """
                SELECT material_id, subtopic_id,
                       COALESCE(tags, '') || ' ' || COALESCE(keywords, '') AS text_features
                FROM learning_materials
                WHERE topic_id    = $1
                  AND subtopic_id = ANY($2)
                  AND is_active   = TRUE
                """,
                topic_id, subtopics,
            )
            if rows:
                return rows
            # Fall through to full topic fetch (with cache)

        now = time.monotonic()
        cached = _materials_cache.get(topic_id)
        if cached and now < cached[1]:
            return cached[0]

        rows = await self.pool.fetch(
            """
            SELECT material_id, subtopic_id,
                   COALESCE(tags, '') || ' ' || COALESCE(keywords, '') AS text_features
            FROM learning_materials
            WHERE topic_id = $1
              AND is_active = TRUE
            """,
            topic_id,
        )
        _materials_cache[topic_id] = (list(rows), now + _MATERIALS_TTL)
        return rows
