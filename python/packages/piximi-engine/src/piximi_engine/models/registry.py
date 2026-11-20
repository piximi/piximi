"""The models an engine serves: in-process ones, and plugins that run in
their own environments. Registered from code, from ``piximi.models``
entry points, from directories, or at runtime (a notebook); every change
is announced so connected clients refresh their model list."""

from __future__ import annotations

import importlib.util
import logging
from collections.abc import Callable, Iterable
from importlib.metadata import entry_points
from pathlib import Path
from typing import TYPE_CHECKING

from piximi_link.peer import HandlerContext
from piximi_schema.segmentation import ModelDescriptor

from .base import SegmentationModel
from .manifest import MANIFEST_NAME, ManifestError, PluginManifest, load_manifest
from .threshold import ThresholdSegmenter

if TYPE_CHECKING:
    from .plugin import PluginModel, PluginService

log = logging.getLogger(__name__)

ENTRY_POINT_GROUP = "piximi.models"


def appose_available() -> bool:
    return importlib.util.find_spec("appose") is not None


class ModelRegistry:
    def __init__(
        self,
        *,
        gpu: bool = True,
        max_loaded_plugins: int = 2,
        on_change: Callable[[], None] | None = None,
    ) -> None:
        self.models: dict[str, SegmentationModel] = {}
        self.gpu = gpu
        self.max_loaded_plugins = max_loaded_plugins
        """Plugin models kept loaded at once; the least recently used is
        unloaded beyond that, since each holds a worker process (and its
        GPU memory) until it is."""
        self.on_change = on_change
        self._plugins: dict[str, PluginService] = {}

    # ── Registration ─────────────────────────────────────────────────────────

    def add(self, model: SegmentationModel) -> None:
        """Registers a model that runs in this process."""
        if model.id in self.models:
            raise ValueError(f'A model "{model.id}" is already registered')
        self.models[model.id] = model
        self._changed()

    def register(self, source: Path | str | PluginManifest) -> list[str]:
        """Registers a plugin from its manifest (or the directory holding
        one); returns the ids of the models it added. Registering a plugin
        again replaces it, so a notebook can iterate on one."""
        from .plugin import PluginModel, PluginService  # noqa: PLC0415

        manifest = source if isinstance(source, PluginManifest) else load_manifest(source)
        plugin_id = manifest.plugin.id
        previous = self._plugins.pop(plugin_id, None)
        if previous is not None:
            previous.close_sync()
            for model in previous.models:
                if self.models.get(model.id) is model:
                    del self.models[model.id]

        service = PluginService(manifest, gpu=self.gpu, on_change=self._changed)
        added: list[str] = []
        for spec in manifest.models:
            if spec.id in self.models:
                log.warning('Plugin %s: a model "%s" is already registered; skipping it', plugin_id, spec.id)
                continue
            self.models[spec.id] = PluginModel(spec, manifest, service)
            added.append(spec.id)
        self._plugins[plugin_id] = service
        self._changed()
        return added

    def discover_dir(self, folder: Path | str) -> list[str]:
        """Registers every ``<folder>/*/piximi-model.toml``; a broken one is
        logged and skipped, since one bad plugin must not take the others."""
        added: list[str] = []
        for path in sorted(Path(folder).glob(f"*/{MANIFEST_NAME}")):
            try:
                added.extend(self.register(path))
            except ManifestError as error:
                log.warning("Skipping plugin: %s", error)
        return added

    def discover_entry_points(self) -> list[str]:
        """Registers the plugins installed packages advertise through the
        ``piximi.models`` entry point group. Each entry point names the
        manifest's path (a ``Path`` or string), or a callable returning it."""
        added: list[str] = []
        for entry in entry_points(group=ENTRY_POINT_GROUP):
            try:
                target = entry.load()
                source = target() if callable(target) else target
                added.extend(self.register(Path(source)))
            except Exception as error:  # noqa: BLE001 -- a bad plugin must not take the engine down
                log.warning("Skipping plugin from entry point %s: %s", entry.name, error)
        return added

    # ── Lookup ───────────────────────────────────────────────────────────────

    def get(self, model_id: str) -> SegmentationModel | None:
        return self.models.get(model_id)

    def describe_all(self) -> list[ModelDescriptor]:
        return [model.describe() for model in self.models.values()]

    @property
    def plugins(self) -> dict[str, PluginService]:
        return self._plugins

    # ── Lifecycle ────────────────────────────────────────────────────────────

    async def load(self, model: SegmentationModel, ctx: HandlerContext) -> None:
        """Loads a model, first unloading the least recently used plugin
        models beyond the limit so their workers release memory."""
        from .plugin import PluginModel  # noqa: PLC0415

        if isinstance(model, PluginModel):
            await self._evict(keep=model)
        await model.load(ctx)

    async def unload(self, model: SegmentationModel) -> None:
        await model.unload()
        self._changed()

    async def _evict(self, keep: PluginModel) -> None:
        from .plugin import PluginModel  # noqa: PLC0415

        loaded = sorted(
            (m for m in self.models.values() if isinstance(m, PluginModel) and m.loaded and m is not keep),
            key=lambda m: m.last_used,
        )
        excess = len(loaded) + 1 - self.max_loaded_plugins
        for model in loaded[: max(0, excess)]:
            log.info("Unloading %s to make room", model.id)
            await self.unload(model)

    async def close(self) -> None:
        for service in self._plugins.values():
            await service.close()

    def _changed(self) -> None:
        if self.on_change is not None:
            self.on_change()


def default_registry(*, gpu: bool = True, models_dirs: Iterable[Path | str] = ()) -> ModelRegistry:
    """The models this engine serves: the threshold baseline always; StarDist2D
    through cellcast in this process when that package is installed but the
    plugin runner is not (plugins supersede it otherwise); then every plugin
    advertised by an installed package or found in ``models_dirs``."""
    registry = ModelRegistry(gpu=gpu)
    registry.add(ThresholdSegmenter())
    if importlib.util.find_spec("cellcast") is not None and not appose_available():
        from .cellcast import CellcastStarDist  # noqa: PLC0415

        registry.add(CellcastStarDist("fluo", gpu=gpu))
        registry.add(CellcastStarDist("he", gpu=gpu))
    registry.discover_entry_points()
    for folder in models_dirs:
        registry.discover_dir(folder)
    return registry


def default_models(*, gpu: bool = True) -> dict[str, SegmentationModel]:
    """The in-process model set, for callers that want a plain mapping."""
    return default_registry(gpu=gpu).models



