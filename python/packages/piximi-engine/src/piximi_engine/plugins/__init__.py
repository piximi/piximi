"""Model plugins the engine ships, each in its own environment, which is
built the first time one of its models is loaded. They are advertised
through the ``piximi.models`` entry point group, so an engine that has the
plugin runner (``piximi-engine[appose]``) lists them without configuration.
"""

from pathlib import Path

_HERE = Path(__file__).resolve().parent

CELLCAST = _HERE / "cellcast" / "piximi-model.toml"
"""StarDist2D through cellcast: Rust/Burn on wgpu, so GPU on macOS too."""

CELLPOSE = _HERE / "cellpose" / "piximi-model.toml"
"""Cellpose 3 on PyTorch: a second framework, to prove the isolation."""
