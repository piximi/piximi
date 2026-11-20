"""What a classifier looks like to the engine: an architecture the backend
lists, which makes models that train on arrays and predict probabilities.
This is the in-process form; plugin architectures run the same contract
inside their own environments.
"""

from __future__ import annotations

import io
from abc import ABC, abstractmethod
from collections.abc import Callable

import numpy as np

from piximi_schema.classification import (
    ModelLayer,
    OptimizationAlgorithm,
    OptimizerSettings,
    RunHistoryEpoch,
    RunStatus,
)
from piximi_schema.entities import Shape
from piximi_schema.segmentation import (
    ChannelPolicy,
    ChannelPolicyPassthrough,
    ModelDescriptor,
    ModelLink,
    ModelResources,
    ModelStatus,
    ModelTask,
)

EpochReport = Callable[[RunHistoryEpoch], None]
Cancelled = Callable[[], bool]


class ClassificationModel(ABC):
    """One classifier's weights. ``build`` sizes it to the categories; ``fit``
    reports each epoch and stops early when asked."""

    @abstractmethod
    def build(self, num_classes: int, input_shape: Shape, seed: int) -> None: ...

    @abstractmethod
    def fit(
        self,
        x: np.ndarray,
        y: np.ndarray,
        val_x: np.ndarray,
        val_y: np.ndarray,
        options: OptimizerSettings,
        report: EpochReport,
        cancelled: Cancelled,
    ) -> RunStatus:
        """Trains for ``options.epochs`` more epochs; ``stopped`` when
        ``cancelled()`` turned true between epochs."""

    @abstractmethod
    def predict(self, x: np.ndarray) -> np.ndarray:
        """``(N, K)`` class probabilities."""

    @abstractmethod
    def save(self) -> bytes: ...

    @abstractmethod
    def load(self, data: bytes) -> None: ...

    def summary(self) -> list[ModelLayer] | None:
        return None

    @property
    def device(self) -> str:
        return "cpu"

    @property
    def framework_version(self) -> str:
        return ""


class ClassificationArchitecture(ABC):
    """A listed model with a classification task: what ``create`` builds
    classifiers from."""

    id: str
    display_name: str
    description: str = ""
    use: str = ""
    framework: str = "python"
    version: str | None = None
    sources: list[ModelLink] = []
    resources: ModelResources | None = None
    channel_policy: ChannelPolicy = ChannelPolicyPassthrough(mode="passthrough", max_channels=16)
    tasks: list[ModelTask] = [ModelTask.CLASSIFICATION, ModelTask.CLASSIFICATION_TRAIN]

    @property
    def status(self) -> ModelStatus:
        return ModelStatus.READY

    @property
    def status_message(self) -> str | None:
        return None

    @abstractmethod
    def create(self) -> ClassificationModel: ...

    def describe(self) -> ModelDescriptor:
        return ModelDescriptor(
            name=self.id,
            display_name=self.display_name,
            model_loaded=False,
            status=self.status,
            status_message=self.status_message,
            framework=self.framework,
            version=self.version,
            tasks=self.tasks,
            resources=self.resources,
            channel_policy=self.channel_policy,
            cancellable_load=False,
            description=self.description,
            use=self.use,
            sources=self.sources,
        )


# ── A numpy softmax regression, for CI and as a baseline ────────────────────


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


class LogisticClassifier(ClassificationModel):
    """Multinomial logistic regression over the flattened pixels, trained by
    mini-batch gradient descent. Deterministic for a seed."""

    def __init__(self) -> None:
        self.weights: np.ndarray | None = None
        self.bias: np.ndarray | None = None
        self.input_shape: tuple[int, int, int] = (0, 0, 0)
        self._rng = np.random.default_rng(0)

    def build(self, num_classes: int, input_shape: Shape, seed: int) -> None:
        self.input_shape = (input_shape.channels, input_shape.height, input_shape.width)
        features = int(np.prod(self.input_shape))
        self._rng = np.random.default_rng(seed)
        self.weights = (self._rng.standard_normal((features, num_classes)) * 0.01).astype(np.float32)
        self.bias = np.zeros(num_classes, dtype=np.float32)

    def _logits(self, x: np.ndarray) -> np.ndarray:
        assert self.weights is not None and self.bias is not None, "build first"
        return x.reshape(len(x), -1) @ self.weights + self.bias

    def predict(self, x: np.ndarray) -> np.ndarray:
        return _softmax(self._logits(np.asarray(x, dtype=np.float32)))

    def _loss_and_accuracy(self, x: np.ndarray, y: np.ndarray) -> tuple[float, float]:
        if len(y) == 0:
            return 0.0, 0.0
        probabilities = self.predict(x)
        clipped = np.clip(probabilities[np.arange(len(y)), y], 1e-7, 1.0)
        return float(-np.log(clipped).mean()), float((probabilities.argmax(axis=1) == y).mean())

    def fit(
        self,
        x: np.ndarray,
        y: np.ndarray,
        val_x: np.ndarray,
        val_y: np.ndarray,
        options: OptimizerSettings,
        report: EpochReport,
        cancelled: Cancelled,
    ) -> RunStatus:
        assert self.weights is not None and self.bias is not None, "build first"
        x = np.asarray(x, dtype=np.float32).reshape(len(x), -1)
        y = np.asarray(y)
        num_classes = self.weights.shape[1]
        rate = float(options.learning_rate)
        # Momentum-style optimizers are approximated by plain gradient steps.
        if options.optimization_algorithm not in (OptimizationAlgorithm.SGD, OptimizationAlgorithm.ADAM):
            rate = rate
        batch = max(1, int(options.batch_size))
        for epoch in range(int(options.epochs)):
            if cancelled():
                return RunStatus.STOPPED
            order = self._rng.permutation(len(x))
            for start in range(0, len(x), batch):
                rows = order[start : start + batch]
                probabilities = _softmax(x[rows] @ self.weights + self.bias)
                probabilities[np.arange(len(rows)), y[rows]] -= 1.0
                gradient = x[rows].T @ probabilities / len(rows)
                self.weights -= rate * gradient.astype(np.float32)
                self.bias -= rate * probabilities.mean(axis=0).astype(np.float32)
            loss, accuracy = self._loss_and_accuracy(x, y)
            val_loss, val_accuracy = self._loss_and_accuracy(val_x, val_y)
            report(
                RunHistoryEpoch(
                    epoch=epoch, loss=loss, val_loss=val_loss, accuracy=accuracy, val_accuracy=val_accuracy
                )
            )
        del num_classes
        return RunStatus.COMPLETED

    def save(self) -> bytes:
        buffer = io.BytesIO()
        np.savez(buffer, weights=self.weights, bias=self.bias, input_shape=np.array(self.input_shape))
        return buffer.getvalue()

    def load(self, data: bytes) -> None:
        with np.load(io.BytesIO(data)) as saved:
            self.weights = saved["weights"].astype(np.float32)
            self.bias = saved["bias"].astype(np.float32)
            self.input_shape = tuple(int(v) for v in saved["input_shape"])  # type: ignore[assignment]

    def summary(self) -> list[ModelLayer] | None:
        if self.weights is None:
            return None
        features, classes = self.weights.shape
        return [
            ModelLayer(layer_name="flatten", output_shape=str(features), parameters=0, trainable=False),
            ModelLayer(
                layer_name="dense_softmax",
                output_shape=str(classes),
                parameters=int(features * classes + classes),
                trainable=True,
            ),
        ]

    @property
    def framework_version(self) -> str:
        return np.__version__


class LogisticArchitecture(ClassificationArchitecture):
    id = "logistic"
    display_name = "Logistic regression"
    description = "Softmax regression over the pixels; quick, and a baseline for any image"
    use = "A first classifier when the images differ in overall appearance"
    framework = "numpy"

    def __init__(self) -> None:
        self.version = np.__version__

    def create(self) -> ClassificationModel:
        return LogisticClassifier()
