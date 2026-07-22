"""
Unit tests for the ALMSLARSA recommendation engine (cbf.py, cf.py, hybrid.py, main.py).

Each test seeds a known, hand-computable fixture and asserts the function's
output against a value calculated independently of the code under test.
Run with:  pytest test_recommendation_engine.py -v
"""

import math
from unittest.mock import AsyncMock

import pytest

from cbf import ContentBasedFilter
from cf import CollaborativeFilter
from hybrid import HybridMerger
import main as main_module


def make_pool(fetch_return):
    """A fake asyncpg.Pool whose .fetch() always returns the given rows."""
    pool = AsyncMock()
    pool.fetch = AsyncMock(return_value=fetch_return)
    return pool


# ---------------------------------------------------------------------------
# hybrid.py — HybridMerger.merge()
# ---------------------------------------------------------------------------

def test_merge_applies_documented_alpha_weight():
    cbf_scores = [
        {"material_id": 1, "score": 0.8, "reason": "CBF reason A"},
        {"material_id": 2, "score": 0.5, "reason": "CBF reason B"},
    ]
    cf_scores = [
        {"material_id": 2, "score": 0.9, "reason": "CF reason B"},
        {"material_id": 3, "score": 0.3, "reason": "CF reason C"},
    ]
    result = HybridMerger().merge(cbf_scores, cf_scores, alpha=0.4)
    by_id = {r["material_id"]: r["score"] for r in result}

    # Hand-calculated expected scores at alpha=0.4 (CBF weight) / 0.6 (CF weight)
    assert math.isclose(by_id[1], 0.4 * 0.8, rel_tol=1e-9)                  # CBF-only
    assert math.isclose(by_id[2], 0.4 * 0.5 + 0.6 * 0.9, rel_tol=1e-9)      # both
    assert math.isclose(by_id[3], 0.6 * 0.3, rel_tol=1e-9)                  # CF-only


def test_merge_sorts_by_caller_not_internally():
    # merge() itself does not sort — main.py sorts the merged list afterwards.
    # This test documents that contract so a future change to either function
    # doesn't silently break ordering.
    cbf_scores = [{"material_id": 1, "score": 0.1, "reason": "x"}]
    cf_scores  = [{"material_id": 2, "score": 0.9, "reason": "y"}]
    result = HybridMerger().merge(cbf_scores, cf_scores, alpha=0.4)
    assert [r["material_id"] for r in result] == [1, 2]  # insertion order, unsorted
    top = sorted(result, key=lambda x: x["score"], reverse=True)
    assert [r["material_id"] for r in top] == [2, 1]      # main.py's actual sort


# ---------------------------------------------------------------------------
# cf.py — CollaborativeFilter.score()
# Fixture mirrors the real 2026-07-10 production event (Student A=15, B=16,
# shared Material 1, A's unseen Material 34) so this unit-level result can be
# cross-checked against the live production numbers in Table 4.6/4.7.
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cf_surfaces_peer_unseen_material():
    rows = [
        {"student_id": 15, "material_id": 1,  "implicit_score": 1.0},
        {"student_id": 15, "material_id": 34, "implicit_score": 1.0},
        {"student_id": 16, "material_id": 1,  "implicit_score": 1.0},
    ]
    cf = CollaborativeFilter(make_pool(rows))
    result = await cf.score(user_id=16, topic_id=1)

    # Hand calculation: target B=[1,0], peer A=[1,1] -> cosine = 1/sqrt(2)
    # normalized score for material 34 = (cos * 1.0) / cos = 1.0 exactly.
    assert len(result) == 1
    assert result[0]["material_id"] == 34
    assert math.isclose(result[0]["score"], 1.0, rel_tol=1e-9)


@pytest.mark.asyncio
async def test_cf_excludes_materials_target_already_saw():
    rows = [
        {"student_id": 15, "material_id": 1, "implicit_score": 1.0},
        {"student_id": 15, "material_id": 2, "implicit_score": 1.0},
        {"student_id": 16, "material_id": 1, "implicit_score": 1.0},
        {"student_id": 16, "material_id": 2, "implicit_score": 1.0},
    ]
    cf = CollaborativeFilter(make_pool(rows))
    result = await cf.score(user_id=16, topic_id=1)
    # A's only materials are ones B has already seen -> nothing new to surface.
    assert result == []


@pytest.mark.asyncio
async def test_cf_returns_empty_when_no_peer_data_for_topic():
    cf = CollaborativeFilter(make_pool([]))
    result = await cf.score(user_id=16, topic_id=2)
    assert result == []


# ---------------------------------------------------------------------------
# cbf.py — ContentBasedFilter.score()
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cbf_ranks_matching_material_above_unrelated_material():
    materials = [
        {"material_id": 7, "subtopic_id": None, "topic_id": 2, "text_features": "cofactor expansion video minors"},
        {"material_id": 9, "subtopic_id": None, "topic_id": 2, "text_features": "practice drill triangular diagonal"},
    ]
    pool = AsyncMock()
    pool.fetchval = AsyncMock(return_value=None)          # topic 2 has no prerequisite in this fixture
    pool.fetch = AsyncMock(side_effect=[[], materials])  # weak-tag query, then materials query
    cbf = ContentBasedFilter(pool)
    result = await cbf.score(user_id=16, topic_id=2, weak_subtopics=[])

    by_id = {r["material_id"]: r["score"] for r in result}
    # No shared vocabulary between material 9's text and the query -> exactly 0.
    assert by_id[9] == 0.0
    assert by_id[7] > by_id[9]
    assert result[0]["reason"] == "Introductory material for topic"  # no weak_tags supplied


@pytest.mark.asyncio
async def test_cbf_reason_cites_weak_tags_when_present():
    weak_tags = ["cofactor expansion"]
    materials = [{"material_id": 7, "subtopic_id": None, "topic_id": 2, "text_features": "cofactor expansion video"}]
    pool = AsyncMock()
    pool.fetchval = AsyncMock(return_value=None)
    pool.fetch = AsyncMock(side_effect=[
        [{"topic_tag": t} for t in weak_tags],
        materials,
    ])
    cbf = ContentBasedFilter(pool)
    result = await cbf.score(user_id=16, topic_id=2)
    assert "Covers weak subtopics: cofactor expansion" in result[0]["reason"]


@pytest.mark.asyncio
async def test_cbf_returns_empty_when_topic_has_no_materials():
    pool = AsyncMock()
    pool.fetchval = AsyncMock(return_value=None)
    pool.fetch = AsyncMock(side_effect=[[], []])
    cbf = ContentBasedFilter(pool)
    result = await cbf.score(user_id=1, topic_id=99)
    assert result == []


@pytest.mark.asyncio
async def test_cbf_widens_search_to_prerequisite_topic():
    # Topic 2 (Determinants) requires topic 1 (Matrices), mirroring the real seeded
    # chain in topic_prerequisites. A material from the prerequisite topic should
    # still be fetched and clearly labelled as such.
    materials = [
        {"material_id": 34, "subtopic_id": None, "topic_id": 1, "text_features": "matrix properties review"},
        {"material_id": 7,  "subtopic_id": None, "topic_id": 2, "text_features": "cofactor expansion video"},
    ]
    pool = AsyncMock()
    pool.fetchval = AsyncMock(return_value=1)  # required_topic_id for topic 2
    pool.fetch = AsyncMock(side_effect=[[], materials])
    cbf = ContentBasedFilter(pool)
    result = await cbf.score(user_id=16, topic_id=2, weak_subtopics=[])

    # The materials query must have been asked for both topic 2 and its prerequisite, topic 1.
    materials_call_args = pool.fetch.call_args_list[-1].args
    assert set(materials_call_args[-1]) == {1, 2}

    by_id = {r["material_id"]: r["reason"] for r in result}
    assert by_id[34] == "Foundational material from a prerequisite topic"
    assert by_id[7] == "Introductory material for topic"


# ---------------------------------------------------------------------------
# main.py — /recommend branch dispatcher
# Forces each algorithm_used branch exactly as main.py's real logic selects it.
# ---------------------------------------------------------------------------

class FakeEngine:
    def __init__(self, return_value):
        self._return_value = return_value
    async def score(self, *args, **kwargs):
        return self._return_value


@pytest.mark.asyncio
async def test_dispatcher_picks_cold_start_when_one_distinct_user(monkeypatch):
    monkeypatch.setattr(main_module, "_get_student_count", AsyncMock(return_value=1))
    monkeypatch.setattr(main_module, "cbf_engine", FakeEngine([{"material_id": 1, "score": 0.7, "reason": "r"}]))
    monkeypatch.setattr(main_module, "cf_engine",  FakeEngine([{"material_id": 99, "score": 1.0, "reason": "should not be reached"}]))

    resp = await main_module.recommend(main_module.RecommendRequest(user_id=15, topic_id=1))
    assert [r["algorithm_used"] for r in resp["recommendations"]] == ["cold_start"]
    assert resp["recommendations"][0]["material_id"] == 1


@pytest.mark.asyncio
async def test_dispatcher_falls_back_to_content_based_when_cf_empty(monkeypatch):
    monkeypatch.setattr(main_module, "_get_student_count", AsyncMock(return_value=2))
    monkeypatch.setattr(main_module, "cbf_engine", FakeEngine([{"material_id": 7, "score": 0.18, "reason": "r"}]))
    monkeypatch.setattr(main_module, "cf_engine",  FakeEngine([]))

    resp = await main_module.recommend(main_module.RecommendRequest(user_id=16, topic_id=2))
    assert [r["algorithm_used"] for r in resp["recommendations"]] == ["content_based"]


@pytest.mark.asyncio
async def test_dispatcher_picks_hybrid_when_both_nonempty(monkeypatch):
    monkeypatch.setattr(main_module, "_get_student_count", AsyncMock(return_value=2))
    monkeypatch.setattr(main_module, "cbf_engine", FakeEngine([{"material_id": 34, "score": 0.6985, "reason": "r"}]))
    monkeypatch.setattr(main_module, "cf_engine",  FakeEngine([{"material_id": 34, "score": 1.0, "reason": "peer"}]))

    resp = await main_module.recommend(main_module.RecommendRequest(user_id=16, topic_id=1))
    assert [r["algorithm_used"] for r in resp["recommendations"]] == ["hybrid"]
    assert math.isclose(resp["recommendations"][0]["confidence_score"], 0.8794, abs_tol=0.0001)
