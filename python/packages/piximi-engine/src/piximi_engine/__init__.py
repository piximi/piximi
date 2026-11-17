"""The reference Piximi engine: a backend that owns a project's pixels,
metadata, measurements and segmentation models, served to the frontend
through ``piximi-link``."""

from .engine import ReferenceEngine

__all__ = ["ReferenceEngine"]
