"""The classification vectors: the seeded shuffle, the training split,
fingerprints and the partition and correction rules, as the frontend
computes them (``src/core/backend/classification/vectors.test.ts``)."""

import json
from pathlib import Path

import pytest
from piximi_schema.entities import Partition, PredictionCorrection

from piximi_engine.classification import (
    LabeledItem,
    SplitOptions,
    fingerprint_items,
    hash_category_set,
    mulberry32,
    next_partition,
    prediction_correction,
    seeded_shuffle,
    split_for_training,
)

VECTORS = json.loads((Path(__file__).parent / "vectors" / "classification.json").read_text())


@pytest.mark.parametrize("case", VECTORS["mulberry32"], ids=[str(c["seed"]) for c in VECTORS["mulberry32"]])
def test_mulberry32(case):
    rng = mulberry32(case["seed"])
    assert [rng() for _ in range(case["count"])] == case["expect"]


@pytest.mark.parametrize("case", VECTORS["shuffle"], ids=[str(c["seed"]) for c in VECTORS["shuffle"]])
def test_seeded_shuffle(case):
    assert seeded_shuffle(case["items"], case["seed"]) == case["expect"]


@pytest.mark.parametrize("case", VECTORS["split"], ids=[c["name"] for c in VECTORS["split"]])
def test_split(case):
    items = [LabeledItem(row["id"], row["categoryId"], Partition(row["partition"])) for row in case["items"]]
    o = case["options"]
    result = split_for_training(
        items,
        SplitOptions(
            training_percentage=o["trainingPercentage"],
            shuffle=o["shuffle"],
            seed=o["seed"],
            continued=o["continued"],
        ),
    )
    assert [item.id for item in result.training] == case["expect"]["training"]
    assert [item.id for item in result.validation] == case["expect"]["validation"]
    assert [item.id for item in result.inference] == case["expect"]["inference"]
    assert [{"id": id, "partition": partition.value} for id, partition in result.assignments] == case["expect"][
        "assignments"
    ]


@pytest.mark.parametrize("case", VECTORS["fingerprint"])
def test_fingerprint(case):
    assert fingerprint_items((row["id"], row["categoryId"]) for row in case["items"]) == case["expect"]


@pytest.mark.parametrize("case", VECTORS["categorySetHash"])
def test_category_set_hash(case):
    assert hash_category_set(case["ids"]) == case["expect"]


@pytest.mark.parametrize("case", VECTORS["partition"])
def test_next_partition(case):
    assert next_partition(case["categoryId"], Partition(case["current"]), case["predicted"]) == Partition(
        case["expect"]
    )


@pytest.mark.parametrize("case", VECTORS["correction"], ids=[c["name"] for c in VECTORS["correction"]])
def test_prediction_correction(case):
    existing = (
        PredictionCorrection.model_validate(case["existingCorrection"]) if case["existingCorrection"] else None
    )
    result = prediction_correction(
        case["existing"],
        case["next"],
        case["prediction"].get("predictedAtRunId"),
        case["prediction"].get("predictionConfidence"),
        existing,
        case["correctedAt"],
    )
    assert (result.to_wire() if result else None) == case["expect"]
