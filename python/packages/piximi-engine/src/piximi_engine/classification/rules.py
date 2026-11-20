"""What a category change does to an item (``core/entities/prediction.ts``)."""

from __future__ import annotations

from piximi_schema.entities import Partition, PredictionCorrection
from piximi_schema.unknown import represents_unknown


def next_partition(category_id: str, current: Partition, predicted: bool) -> Partition:
    """A prediction leaves the partition alone (the item stays in inference
    until accepted); a hand-made change to unknown sends it to inference,
    and one to a known category keeps a training or validation assignment
    and otherwise unassigns."""
    if predicted:
        return current
    if represents_unknown(category_id):
        return Partition.INFERENCE
    if current in (Partition.TRAINING, Partition.VALIDATION):
        return current
    return Partition.UNASSIGNED


def prediction_correction(
    existing_category_id: str,
    new_category_id: str,
    predicted_at_run_id: str | None,
    prediction_confidence: float | None,
    existing: PredictionCorrection | None,
    corrected_at: str,
) -> PredictionCorrection | None:
    """A correction when a predicted item moves by hand to another known
    category, nothing when it returns to unknown, else what was recorded."""
    becoming_unknown = represents_unknown(new_category_id)
    if predicted_at_run_id and not becoming_unknown and new_category_id != existing_category_id:
        return PredictionCorrection(
            corrected_from_run_id=predicted_at_run_id,
            predicted_category_id=existing_category_id,
            prediction_confidence=prediction_confidence if prediction_confidence is not None else 0.0,
            corrected_at=corrected_at,
        )
    return None if becoming_unknown else existing
