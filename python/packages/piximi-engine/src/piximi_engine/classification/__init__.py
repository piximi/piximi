"""The classification rules every backend shares: the seeded training
split, dataset fingerprints, and what a category change does to an item's
partition and prediction record. The frontend's implementations are the
reference; ``tests/vectors/classification.json`` pins both."""

from .fingerprint import fingerprint_items, hash_category_set, hash_lines
from .prng import mulberry32, seeded_shuffle
from .rules import next_partition, prediction_correction
from .split import LabeledItem, SplitOptions, TrainingSplit, split_for_training, split_unassigned

__all__ = [
    "LabeledItem",
    "SplitOptions",
    "TrainingSplit",
    "fingerprint_items",
    "hash_category_set",
    "hash_lines",
    "mulberry32",
    "next_partition",
    "prediction_correction",
    "seeded_shuffle",
    "split_for_training",
    "split_unassigned",
]
