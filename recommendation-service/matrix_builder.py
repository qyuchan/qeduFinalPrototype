"""
Nightly job: rebuilds the user_item_matrix table from interaction_logs.
Run via cron: 0 2 * * * python matrix_builder.py
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()


async def rebuild(pool: asyncpg.Pool) -> None:
    rows = await pool.fetch(
        """
        SELECT user_id AS student_id,
               material_id,
               AVG(
                   CASE interaction_type
                       WHEN 'completed'   THEN 1.0
                       WHEN 'rated'       THEN COALESCE(rating / 5.0, 0.5)
                       WHEN 'bookmarked'  THEN 0.6
                       WHEN 'downloaded'  THEN 0.4
                       WHEN 'viewed'      THEN 0.3
                       ELSE 0.1
                   END
               ) AS implicit_score
        FROM interaction_logs
        GROUP BY user_id, material_id
        """
    )

    if not rows:
        print("No interaction data — skipping rebuild.")
        return

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("DELETE FROM user_item_matrix")
            await conn.executemany(
                """
                INSERT INTO user_item_matrix (student_id, material_id, implicit_score, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (student_id, material_id)
                DO UPDATE SET implicit_score = EXCLUDED.implicit_score, updated_at = NOW()
                """,
                [(r["student_id"], r["material_id"], float(r["implicit_score"])) for r in rows],
            )

    print(f"Rebuilt user_item_matrix: {len(rows)} entries.")


async def main() -> None:
    pool = await asyncpg.create_pool(os.getenv("DATABASE_URL"))
    try:
        await rebuild(pool)
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
