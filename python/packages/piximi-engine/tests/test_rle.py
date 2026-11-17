import json
from pathlib import Path

import numpy as np
import pytest

from piximi_engine.rle import decode_mask, encode_mask

VECTORS = json.loads((Path(__file__).parent / "vectors" / "rle.json").read_text())["cases"]


@pytest.mark.parametrize("case", VECTORS, ids=[c["name"] for c in VECTORS])
def test_matches_shared_vectors(case):
    shape = tuple(case["shape"])
    mask = np.array(case["mask"], dtype=bool).reshape(shape)
    assert encode_mask(mask) == case["runs"]
    assert np.array_equal(decode_mask(case["runs"], shape), mask)


def test_round_trips_random_masks():
    rng = np.random.default_rng(1)
    for _ in range(50):
        shape = (int(rng.integers(1, 12)), int(rng.integers(1, 12)))
        mask = rng.random(shape) > 0.5
        assert np.array_equal(decode_mask(encode_mask(mask), shape), mask)
