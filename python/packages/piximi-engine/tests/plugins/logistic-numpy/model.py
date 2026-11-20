"""Softmax regression over the flattened pixels, as a plugin: the same
model the engine ships in-process, run in a worker of its own."""

import io

import numpy as np

from piximi_model_sdk import ClassificationModel, Context


def _softmax(logits):
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


class Logistic(ClassificationModel):
    framework_version = np.__version__

    def __init__(self):
        self.weights = None
        self.bias = None
        self._rng = np.random.default_rng(0)

    def build(self, num_classes, input_shape, seed):
        features = int(np.prod(input_shape))
        self._rng = np.random.default_rng(seed)
        self.weights = (self._rng.standard_normal((features, num_classes)) * 0.01).astype(np.float32)
        self.bias = np.zeros(num_classes, dtype=np.float32)

    def _metrics(self, x, y):
        if len(y) == 0:
            return 0.0, 0.0
        probabilities = self.predict(x)
        clipped = np.clip(probabilities[np.arange(len(y)), y], 1e-7, 1.0)
        return float(-np.log(clipped).mean()), float((probabilities.argmax(axis=1) == y).mean())

    def fit(self, x, y, val_x, val_y, options, ctx: Context):
        x = np.asarray(x, dtype=np.float32).reshape(len(x), -1)
        y = np.asarray(y)
        rate = float(options.get("learningRate", 0.01))
        batch = max(1, int(options.get("batchSize", 32)))
        for epoch in range(int(options.get("epochs", 1))):
            if ctx.cancelled:
                return
            order = self._rng.permutation(len(x))
            for start in range(0, len(x), batch):
                rows = order[start : start + batch]
                probabilities = _softmax(x[rows] @ self.weights + self.bias)
                probabilities[np.arange(len(rows)), y[rows]] -= 1.0
                self.weights -= rate * (x[rows].T @ probabilities / len(rows)).astype(np.float32)
                self.bias -= rate * probabilities.mean(axis=0).astype(np.float32)
            loss, accuracy = self._metrics(x, y)
            val_loss, val_accuracy = self._metrics(val_x, val_y)
            ctx.epoch(epoch, loss, val_loss, accuracy, val_accuracy)

    def predict(self, x):
        x = np.asarray(x, dtype=np.float32).reshape(len(x), -1)
        return _softmax(x @ self.weights + self.bias)

    def save(self):
        buffer = io.BytesIO()
        np.savez(buffer, weights=self.weights, bias=self.bias)
        return buffer.getvalue()

    def load(self, data):
        with np.load(io.BytesIO(data)) as saved:
            self.weights = saved["weights"]
            self.bias = saved["bias"]

    def summary(self):
        if self.weights is None:
            return None
        features, classes = self.weights.shape
        return [
            {"layerName": "flatten", "outputShape": str(features), "parameters": 0, "trainable": False},
            {
                "layerName": "dense_softmax",
                "outputShape": str(classes),
                "parameters": int(features * classes + classes),
                "trainable": True,
            },
        ]


MODEL = Logistic()
