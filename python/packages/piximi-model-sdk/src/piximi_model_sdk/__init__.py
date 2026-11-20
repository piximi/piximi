"""What a Piximi model plugin implements.

A plugin is a ``piximi-model.toml`` manifest next to a Python module. The
manifest declares the model's identity, its environment (the packages it
needs, which the engine builds into an isolated environment) and what the
UI shows: channel and output policies and the option fields. The module
provides a :class:`SegmentationModel` whose ``segment`` turns an image into
a label image, or a :class:`ClassificationModel` the engine trains on the
project's labeled items. It runs inside that environment, never inside the
engine's, so it may depend on anything.

This package is the only thing a plugin imports from Piximi. It depends on
numpy alone, so it installs into any environment.
"""

from .model import Cancelled, ClassificationModel, Context, LabelResult, SegmentationModel

__all__ = ["Cancelled", "ClassificationModel", "Context", "LabelResult", "SegmentationModel"]
