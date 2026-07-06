import asyncpg
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


class CollaborativeFilter:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def score(self, user_id: int, topic_id: int) -> list[dict]:
        # Pull cached user-item matrix (student_id / implicit_score — matches schema)
        rows = await self.pool.fetch(
            """
            SELECT uim.student_id, uim.material_id, uim.implicit_score
            FROM user_item_matrix   uim
            JOIN learning_materials lm ON uim.material_id = lm.material_id
            WHERE lm.topic_id = $1
            """,
            topic_id,
        )

        if not rows:
            return []

        users     = sorted({r["student_id"]  for r in rows})
        materials = sorted({r["material_id"] for r in rows})
        u_idx     = {u: i for i, u in enumerate(users)}
        m_idx     = {m: i for i, m in enumerate(materials)}

        matrix = np.zeros((len(users), len(materials)))
        for r in rows:
            matrix[u_idx[r["student_id"]], m_idx[r["material_id"]]] = r["implicit_score"]

        if user_id not in u_idx:
            return []

        target    = matrix[u_idx[user_id]].reshape(1, -1)
        sims      = cosine_similarity(target, matrix).flatten()

        scores    = np.zeros(len(materials))
        total_sim = 0.0
        for idx, sim in enumerate(sims):
            if users[idx] == user_id or sim <= 0:
                continue
            scores    += sim * matrix[idx]
            total_sim += sim

        if total_sim == 0:
            return []

        scores /= total_sim

        # Zero out materials this student already interacted with
        seen = {
            m_idx[r["material_id"]]
            for r in rows
            if r["student_id"] == user_id and r["implicit_score"] > 0
        }
        for i in seen:
            scores[i] = 0.0

        return [
            {
                "material_id": materials[i],
                "score":       float(scores[i]),
                "reason":      "Highly rated by students with similar quiz performance",
            }
            for i in range(len(materials))
            if scores[i] > 0
        ]
