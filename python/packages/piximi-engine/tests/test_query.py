"""The query vectors: every filter, sort, page and count the contract
defines, with the ids it must return. The frontend checks the same file."""

import json
from pathlib import Path

import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.testing.dataset import load_dataset, run_case

VECTORS = json.loads((Path(__file__).parent / "vectors" / "query.json").read_text())


@pytest.fixture
def loaded(tmp_path: Path) -> ReferenceEngine:
    engine = ReferenceEngine(tmp_path / "data", models={})
    load_dataset(engine.meta, VECTORS["dataset"])
    return engine


@pytest.mark.parametrize("case", VECTORS["cases"], ids=[case["name"] for case in VECTORS["cases"]])
async def test_query_vector(loaded: ReferenceEngine, case: dict):
    assert await run_case(loaded, case) == case["expect"]
