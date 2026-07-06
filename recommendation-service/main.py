import asyncio
import sys
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import asyncpg
import os

# asyncio's ProactorEventLoop (Windows default) has DNS resolution bugs with
# certain network configurations. SelectorEventLoop uses Winsock directly and
# is more reliable for asyncpg on Windows.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()

from cbf import ContentBasedFilter
from cf import CollaborativeFilter
from hybrid import HybridMerger

DB_URL  = os.getenv("DATABASE_URL")
TOP_N   = int(os.getenv("TOP_N", "5"))

pool:       asyncpg.Pool       = None
cbf_engine: ContentBasedFilter = None
cf_engine:  CollaborativeFilter = None

# Cache student count for 2 minutes (changes rarely)
_student_count: dict = {"value": None, "expires": 0.0}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool, cbf_engine, cf_engine
    pool       = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
    cbf_engine = ContentBasedFilter(pool)
    cf_engine  = CollaborativeFilter(pool)
    yield
    await pool.close()


app = FastAPI(title="QEDU Recommendation Service", version="1.0.0", lifespan=lifespan)


class RecommendRequest(BaseModel):
    user_id:            int
    topic_id:           int
    trigger_attempt_id: int | None = None
    weak_subtopics:     list[str]  = []


async def _get_student_count() -> int:
    now = time.monotonic()
    if _student_count["value"] is not None and now < _student_count["expires"]:
        return _student_count["value"]
    count = await pool.fetchval(
        "SELECT COUNT(DISTINCT user_id) FROM interaction_logs"
    )
    _student_count["value"] = count
    _student_count["expires"] = now + 120.0
    return count


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    student_count = await _get_student_count()
    merger = HybridMerger()

    if student_count <= 1:
        scores = await cbf_engine.score(req.user_id, req.topic_id, req.weak_subtopics)
        algo   = "cold_start"
    else:
        # Run CBF and CF scoring in parallel
        cbf_scores, cf_scores = await asyncio.gather(
            cbf_engine.score(req.user_id, req.topic_id, req.weak_subtopics),
            cf_engine.score(req.user_id, req.topic_id),
        )

        if not cf_scores:
            scores = cbf_scores
            algo   = "content_based"
        else:
            scores = merger.merge(cbf_scores, cf_scores, alpha=0.4)
            algo   = "hybrid"

    top = sorted(scores, key=lambda x: x["score"], reverse=True)[:TOP_N]

    return {
        "recommendations": [
            {
                "material_id":      r["material_id"],
                "algorithm_used":   algo,
                "confidence_score": round(r["score"], 4),
                "reason":           r.get("reason"),
                "subtopic_id":      r.get("subtopic_id"),
            }
            for r in top
            if r["score"] > 0
        ]
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
