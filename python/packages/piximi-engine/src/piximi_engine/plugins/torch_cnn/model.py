"""The browser's Simple CNN (``createSimpleCNN`` in tfjs) in PyTorch, run
in the plugin's own environment."""

from __future__ import annotations

import io
from typing import Any

import numpy as np

from piximi_model_sdk import ClassificationModel, Context

# The frontend's names for the optimizers and losses it offers.
OPTIMIZERS = {
    "Adadelta": "Adadelta",
    "Adagrad": "Adagrad",
    "Adam": "Adam",
    "Adamax": "Adamax",
    "RMSProp": "RMSprop",
    "Stochastic gradient descent (SGD)": "SGD",
    "Momentum": "SGD",
}


def _device(settings: dict[str, Any]) -> str:
    import torch

    if settings.get("gpu", True):
        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    return "cpu"


class SimpleCNN(ClassificationModel):
    def __init__(self) -> None:
        self._net = None
        self._optimizer_state = None
        self._input_shape = (0, 0, 0)
        self._num_classes = 0

    # ── Graph ────────────────────────────────────────────────────────────────

    def _make(self, num_classes: int, input_shape: tuple[int, int, int]) -> Any:
        import torch
        from torch import nn

        channels, height, width = input_shape
        after_conv = lambda size: (size - 5 + 1) // 2  # noqa: E731
        h, w = after_conv(after_conv(height)), after_conv(after_conv(width))
        if h <= 0 or w <= 0:
            raise ValueError(f"The input shape {height}x{width} is too small for two 5x5 convolutions")
        net = nn.Sequential(
            nn.Conv2d(channels, 8, kernel_size=5),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(8, 16, kernel_size=5),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Flatten(),
            nn.Linear(16 * h * w, num_classes),
        )
        for layer in net:
            if isinstance(layer, (nn.Conv2d, nn.Linear)):
                # tfjs's varianceScaling: fan-in scaled, truncated normal.
                nn.init.trunc_normal_(layer.weight, std=(1.0 / layer.weight[0].numel()) ** 0.5)
                nn.init.zeros_(layer.bias)
        return net.to(self.device)

    def build(self, num_classes: int, input_shape: tuple[int, int, int], seed: int) -> None:
        import torch

        self.device = _device(self.settings)
        self.framework_version = torch.__version__
        torch.manual_seed(seed)
        self._input_shape = input_shape
        self._num_classes = num_classes
        self._net = self._make(num_classes, input_shape)
        self._optimizer_state = None

    # ── Training ─────────────────────────────────────────────────────────────

    def _optimizer(self, options: dict[str, Any]) -> Any:
        import torch

        name = OPTIMIZERS.get(str(options.get("optimizationAlgorithm", "Adam")), "Adam")
        rate = float(options.get("learningRate", 0.01))
        kwargs = {"lr": rate}
        if options.get("optimizationAlgorithm") == "Momentum":
            kwargs["momentum"] = 0.9
        optimizer = getattr(torch.optim, name)(self._net.parameters(), **kwargs)
        if self._optimizer_state is not None and self._optimizer_state.get("name") == name:
            try:
                optimizer.load_state_dict(self._optimizer_state["state"])
            except (ValueError, KeyError):
                pass
        return optimizer, name

    def _metrics(self, x: np.ndarray, y: np.ndarray, batch: int) -> tuple[float, float]:
        import torch

        if len(y) == 0:
            return 0.0, 0.0
        self._net.eval()
        loss_total, correct = 0.0, 0
        with torch.no_grad():
            for start in range(0, len(x), batch):
                inputs = torch.as_tensor(np.asarray(x[start : start + batch]), device=self.device)
                targets = torch.as_tensor(np.asarray(y[start : start + batch]), dtype=torch.long, device=self.device)
                logits = self._net(inputs)
                loss_total += torch.nn.functional.cross_entropy(logits, targets, reduction="sum").item()
                correct += int((logits.argmax(1) == targets).sum().item())
        return loss_total / len(y), correct / len(y)

    def fit(self, x, y, val_x, val_y, options: dict[str, Any], ctx: Context) -> None:
        import torch

        batch = max(1, int(options.get("batchSize", 32)))
        epochs = int(options.get("epochs", 1))
        optimizer, name = self._optimizer(options)
        criterion = torch.nn.functional.cross_entropy
        rng = np.random.default_rng(0)
        for epoch in range(epochs):
            if ctx.cancelled:
                break
            self._net.train()
            order = rng.permutation(len(x))
            for start in range(0, len(x), batch):
                rows = np.sort(order[start : start + batch])
                inputs = torch.as_tensor(np.asarray(x[rows]), device=self.device)
                targets = torch.as_tensor(np.asarray(y[rows]), dtype=torch.long, device=self.device)
                optimizer.zero_grad()
                loss = criterion(self._net(inputs), targets)
                loss.backward()
                optimizer.step()
            loss_value, accuracy = self._metrics(x, y, batch)
            val_loss, val_accuracy = self._metrics(val_x, val_y, batch)
            ctx.epoch(epoch, loss_value, val_loss, accuracy, val_accuracy)
        self._optimizer_state = {"name": name, "state": optimizer.state_dict()}

    def predict(self, x) -> np.ndarray:
        import torch

        self._net.eval()
        out = []
        with torch.no_grad():
            for start in range(0, len(x), 256):
                inputs = torch.as_tensor(np.asarray(x[start : start + 256]), device=self.device)
                out.append(torch.softmax(self._net(inputs), dim=1).cpu().numpy())
        return np.concatenate(out) if out else np.zeros((0, self._num_classes), dtype=np.float32)

    # ── Weights ──────────────────────────────────────────────────────────────

    def save(self) -> bytes:
        import torch

        buffer = io.BytesIO()
        torch.save(
            {
                "input_shape": list(self._input_shape),
                "num_classes": self._num_classes,
                "state": {k: v.cpu() for k, v in self._net.state_dict().items()},
            },
            buffer,
        )
        return buffer.getvalue()

    def load(self, data: bytes) -> None:
        import torch

        self.device = _device(self.settings)
        self.framework_version = torch.__version__
        saved = torch.load(io.BytesIO(data), map_location="cpu")
        self._input_shape = tuple(int(v) for v in saved["input_shape"])
        self._num_classes = int(saved["num_classes"])
        self._net = self._make(self._num_classes, self._input_shape)
        self._net.load_state_dict(saved["state"])
        self._optimizer_state = None

    def summary(self):
        if self._net is None:
            return None
        import torch
        from torch import nn

        layers = []
        shape = (1, *self._input_shape)
        with torch.no_grad():
            tensor = torch.zeros(shape, device=self.device)
            for layer in self._net:
                tensor = layer(tensor)
                layers.append(
                    {
                        "layerName": type(layer).__name__.lower(),
                        "outputShape": ",".join(str(v) for v in tensor.shape[1:]),
                        "parameters": sum(p.numel() for p in layer.parameters()),
                        "trainable": isinstance(layer, (nn.Conv2d, nn.Linear)),
                    }
                )
        return layers

    def unload(self) -> None:
        self._net = None
        self._optimizer_state = None


SIMPLE_CNN = SimpleCNN()
