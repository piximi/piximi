"""Which items a run trains on, validates against and leaves for prediction
(``core/backend/classification/split.ts``)."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass, field

from piximi_schema.entities import Partition
from piximi_schema.unknown import represents_unknown

from .prng import seeded_shuffle


@dataclass(frozen=True)
class LabeledItem:
    id: str
    category_id: str
    partition: Partition


@dataclass(frozen=True)
class SplitOptions:
    training_percentage: float
    """The share of labeled, unassigned items that train; the rest validate."""
    shuffle: bool
    seed: int
    continued: bool
    """A continued run keeps the existing sets and trains on everything
    labeled since; a fresh run splits the unassigned labeled items."""


@dataclass
class TrainingSplit:
    training: list[LabeledItem] = field(default_factory=list)
    validation: list[LabeledItem] = field(default_factory=list)
    inference: list[LabeledItem] = field(default_factory=list)
    """Unlabeled items, which the run leaves for prediction."""
    assignments: list[tuple[str, Partition]] = field(default_factory=list)
    """The partition each item moves to; items already placed are absent."""


def _js_round(x: float) -> int:
    """``Math.round``: halves go up, unlike Python's banker's rounding."""
    return math.floor(x + 0.5)


def split_unassigned(
    unassigned: Sequence[LabeledItem], training_percentage: float, *, shuffle: bool, seed: int = 0
) -> tuple[list[LabeledItem], list[LabeledItem]]:
    """Splits per category so every category keeps the same share in each
    set, in the input order or a seeded shuffle of it."""
    totals: dict[str, int] = {}
    for item in unassigned:
        totals[item.category_id] = totals.get(item.category_id, 0) + 1
    counts: dict[str, int] = {category: 0 for category in totals}
    ordered = seeded_shuffle(unassigned, seed) if shuffle else list(unassigned)
    training: list[LabeledItem] = []
    validation: list[LabeledItem] = []
    for item in ordered:
        if counts[item.category_id] < _js_round(totals[item.category_id] * training_percentage):
            training.append(item)
            counts[item.category_id] += 1
        else:
            validation.append(item)
    return training, validation


def split_for_training(items: Sequence[LabeledItem], options: SplitOptions) -> TrainingSplit:
    """Labeled items sitting in the inference partition are pending
    predictions and take no part."""
    inference: list[LabeledItem] = []
    in_training: list[LabeledItem] = []
    in_validation: list[LabeledItem] = []
    unassigned: list[LabeledItem] = []
    for item in items:
        if represents_unknown(item.category_id):
            inference.append(item)
        elif item.partition == Partition.UNASSIGNED:
            unassigned.append(item)
        elif item.partition == Partition.TRAINING:
            in_training.append(item)
        elif item.partition == Partition.VALIDATION:
            in_validation.append(item)

    if options.continued:
        training, validation = unassigned, []
    else:
        training, validation = split_unassigned(
            unassigned, options.training_percentage, shuffle=options.shuffle, seed=options.seed
        )

    assignments = [(item.id, Partition.TRAINING) for item in training]
    assignments += [(item.id, Partition.VALIDATION) for item in validation]
    assignments += [
        (item.id, Partition.INFERENCE) for item in inference if item.partition != Partition.INFERENCE
    ]
    return TrainingSplit(
        training=in_training + training,
        validation=in_validation + validation,
        inference=inference,
        assignments=assignments,
    )
