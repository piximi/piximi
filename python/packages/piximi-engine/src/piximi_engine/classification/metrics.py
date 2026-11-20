"""Evaluation of a classifier on its validation set, as the frontend's
worker computes it (``core/dl/classification/utils.ts``,
``AbstractClassifier.evaluate``)."""

from __future__ import annotations

import numpy as np

from piximi_schema.classification import EvaluationResult


def confusion_matrix(labels: np.ndarray, predictions: np.ndarray, num_classes: int) -> np.ndarray:
    matrix = np.zeros((num_classes, num_classes), dtype=np.int64)
    for truth, guess in zip(labels, predictions):
        matrix[int(truth), int(guess)] += 1
    return matrix


def _safe(numerator: float, denominator: float) -> float:
    return float(numerator / denominator) if denominator else 0.0


def evaluate(probabilities: np.ndarray, labels: np.ndarray, num_classes: int) -> EvaluationResult:
    """``probabilities`` is ``(N, K)``, ``labels`` the true class indices."""
    predictions = probabilities.argmax(axis=1)
    matrix = confusion_matrix(labels, predictions, num_classes)
    clipped = np.clip(probabilities, 1e-7, 1.0)
    cross_entropy = float(-np.log(clipped[np.arange(len(labels)), labels]).mean()) if len(labels) else 0.0
    accuracy = float((predictions == labels).mean()) if len(labels) else 0.0

    if num_classes == 2:
        precision = _safe(matrix[0, 0], matrix[0, 0] + matrix[0, 1])
        recall = _safe(matrix[0, 0], matrix[0, 0] + matrix[1, 0])
        f1 = _safe(2 * precision * recall, precision + recall)
    else:
        precision = recall = f1 = 0.0
        for k in range(num_classes):
            p = _safe(matrix[k, k], matrix[k].sum())
            r = _safe(matrix[k, k], matrix[:, k].sum())
            precision += p
            recall += r
            f1 += _safe(2 * p * r, p + r)
        precision /= num_classes
        recall /= num_classes
        f1 /= num_classes
    return EvaluationResult(
        confusion_matrix=matrix.tolist(),
        accuracy=accuracy,
        cross_entropy=cross_entropy,
        precision=precision,
        recall=recall,
        f1_score=f1,
    )
