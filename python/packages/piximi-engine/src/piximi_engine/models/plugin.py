"""Models that run in their own environments, through Appose.

A plugin's manifest names the packages its environment needs; the engine
builds that environment on first load (as part of the model-load job,
with the build's phases as progress) and keeps one worker process per
plugin, in which the plugin's models live. Each call is an Appose task:
the image goes in as an ``NDArray`` in named shared memory and the label
image comes back the same way, so pixels never cross the worker's pipe.

Cancellation is cooperative on both sides: the engine asks the task to
stop, the model notices through its ``Context``, and a worker that does
not stop within a grace period is killed, which unloads the plugin.
Named shared memory needs the engine and its workers on one host, which
holds: the network split sits in front of the engine, never here.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import tempfile
import threading
import time
import uuid
from collections.abc import Callable
from importlib.metadata import PackageNotFoundError, distribution
from typing import TYPE_CHECKING, Any

import numpy as np

from piximi_link.errors import BackendError, RequestCancelled
from piximi_link.peer import HandlerContext
from piximi_schema.segmentation import ModelStatus

from piximi_schema.classification import ModelLayer, OptimizerSettings, RunHistoryEpoch, RunStatus
from piximi_schema.entities import Shape

from ..classification.models import Cancelled, ClassificationArchitecture, ClassificationModel, EpochReport
from .base import Detection, SegmentationModel, labels_to_detections
from .manifest import ModelSpec, PluginManifest
from .registry import appose_available

if TYPE_CHECKING:
    from appose.environment import Environment
    from appose.service import Service

log = logging.getLogger(__name__)

ENV_PREFIX = "piximi-"
"""Environments live under Appose's directory (``APPOSE_ENVS_DIR``,
default ``~/.local/share/appose``) as ``piximi-<plugin id>``."""
CANCEL_GRACE = 5.0
"""Seconds a cancelled task may keep running before its worker is killed."""
CLOSE_TIMEOUT = 5.0
UNAVAILABLE_MESSAGE = "Install piximi-engine[appose] to run model plugins"

Progress = Callable[[str, float], None]
"""``(message, percent)``, percent -1 while indeterminate."""

INSTANTIATE = "from piximi_model_sdk import worker\nworker.instantiate(key, module, attribute, settings)\n"
LOAD = "from piximi_model_sdk import worker\nworker.load(task, key)\n"
SEGMENT = "from piximi_model_sdk import worker\nworker.segment(task, key, image, options)\n"
UNLOAD = "from piximi_model_sdk import worker\nworker.unload(key)\n"
BUILD = "from piximi_model_sdk import worker\nworker.build(key, num_classes, input_shape, seed)\n"
FIT = "from piximi_model_sdk import worker\nworker.fit(task, key, x, y, val_x, val_y, options)\n"
PREDICT = "from piximi_model_sdk import worker\nworker.predict(key, x)\n"
SAVE = "from piximi_model_sdk import worker\nworker.save_weights(key)\n"
LOAD_WEIGHTS = "from piximi_model_sdk import worker\nworker.load_weights(key, data)\n"

# macOS `pythonw` exports PYTHONEXECUTABLE, which a virtualenv interpreter
# started with it inherits and then ignores its own site-packages. It only
# matters at interpreter start, so dropping it from this process is safe.
os.environ.pop("PYTHONEXECUTABLE", None)


def sdk_requirement() -> list[str]:
    """pip arguments installing this engine's ``piximi-model-sdk`` into a
    plugin environment: from its source directory when it was installed
    that way (the uv workspace), so the worker runs the same code, else
    the released range matching this version."""
    try:
        dist = distribution("piximi-model-sdk")
        text = dist.read_text("direct_url.json")
    except PackageNotFoundError:
        return ["piximi-model-sdk"]
    if text:
        info = json.loads(text)
        url = info.get("url")
        if url and info.get("dir_info") is not None:
            return ["-e", f"piximi-model-sdk @ {url}"]
        if url:
            return [f"piximi-model-sdk @ {url}"]
    major, minor = (int(part) for part in dist.version.split(".")[:2])
    return [f"piximi-model-sdk>={major}.{minor},<{major}.{minor + 1}"]


def _percent(current: int | None, maximum: int | None) -> float:
    if current is None or not maximum or maximum <= 0:
        return -1
    return min(100.0, round(current / maximum * 100))


def _coalesced(progress: Progress, interval: float = 0.25) -> Callable[[str, int, int], None]:
    """Appose reports a download chunk by chunk, thousands of times for one
    build; each report would become a job update broadcast to every client.
    Pass on a new phase at once, and otherwise at most a few times a second."""
    last: dict[str, Any] = {"title": None, "at": 0.0}

    def report(title: str, current: int, maximum: int) -> None:
        now = time.monotonic()
        phase_changed = title != last["title"]
        finished = maximum > 0 and current >= maximum
        if not (phase_changed or finished or now - last["at"] >= interval):
            return
        last["title"], last["at"] = title, now
        detail = f" ({current}/{maximum})" if maximum > 0 else ""
        progress(f"Building environment: {title}{detail}", _percent(current, maximum))

    return report


class PluginService:
    """One plugin's environment and worker process, shared by its models."""

    def __init__(
        self,
        manifest: PluginManifest,
        *,
        gpu: bool = True,
        on_change: Callable[[], None] | None = None,
    ) -> None:
        self.manifest = manifest
        self.id = manifest.plugin.id
        self.gpu = gpu
        self.on_change = on_change
        self.on_debug: Callable[[str], None] | None = None
        """Receives the worker's protocol traffic and stderr, for tests and logs."""
        self.models: list[PluginModel] = []
        """The plugin's models; they register themselves."""
        self._env: Environment | None = None
        self._service: Service | None = None
        self._lock = threading.RLock()
        self._status = ModelStatus.UNAVAILABLE
        self._message: str | None = None
        self._refresh_status()

    # ── Status ───────────────────────────────────────────────────────────────

    @property
    def status(self) -> ModelStatus:
        return self._status

    @property
    def message(self) -> str | None:
        return self._message

    def _set(self, status: ModelStatus, message: str | None) -> None:
        self._status, self._message = status, message
        if self.on_change is not None:
            self.on_change()

    def _refresh_status(self) -> None:
        """What the environment on disk says, without building anything."""
        if not appose_available():
            self._status, self._message = ModelStatus.UNAVAILABLE, UNAVAILABLE_MESSAGE
            return
        from appose import EnvStatus  # noqa: PLC0415

        try:
            state = self._builder().status()
        except Exception as error:  # noqa: BLE001 -- a bad spec is reported, not raised, at registration
            self._status, self._message = ModelStatus.FAILED, f"Environment spec: {error}"
            return
        if state is EnvStatus.CURRENT:
            self._status, self._message = ModelStatus.READY, None
        elif state is EnvStatus.STALE:
            self._status, self._message = ModelStatus.UNAVAILABLE, "Environment out of date; loading rebuilds it"
        elif state is EnvStatus.MISSING:
            self._status, self._message = ModelStatus.UNAVAILABLE, "Environment not built; loading builds it"
        else:
            self._status, self._message = (
                ModelStatus.FAILED,
                f"Environment directory holds something else ({state.value.lower()})",
            )

    # ── Environment ──────────────────────────────────────────────────────────

    def _builder(self) -> Any:
        import appose  # noqa: PLC0415

        spec = self.manifest.plugin.env
        env_file = self.manifest.env_file
        if env_file is None:
            builder = appose.uv().python(spec.python).include(*spec.requirements, *sdk_requirement())
        elif env_file.name == "requirements.txt":
            # A uv build from content gets no appose injected; add it and the SDK.
            from appose.builder.requirement import appose_requirement  # noqa: PLC0415

            text = env_file.read_text(encoding="utf-8").rstrip("\n")
            extra = [" ".join(appose_requirement().pip_args()), " ".join(sdk_requirement())]
            builder = appose.uv().python(spec.python).content(text + "\n" + "\n".join(extra) + "\n")
        elif env_file.name == "pyproject.toml":
            builder = appose.uv(env_file).python(spec.python)
        else:
            builder = appose.pixi(env_file)
        return builder.name(ENV_PREFIX + self.id)

    def build(self, progress: Progress) -> None:
        """Builds the environment if it is not current. Blocking; run it off
        the loop. Builds are not interruptible: pixi and uv leave half an
        environment behind, so a cancel is honoured only once it is done."""
        with self._lock:
            if self._env is not None:
                return
            if not appose_available():
                raise BackendError("NOT_SUPPORTED", UNAVAILABLE_MESSAGE)
            from appose.builder import BuildException  # noqa: PLC0415

            self._set(ModelStatus.BUILDING, "Building environment")
            progress("Building environment", -1)
            builder = self._builder()
            builder.subscribe_progress(_coalesced(progress))
            builder.subscribe_output(lambda line: log.debug("[%s build] %s", self.id, line.rstrip()))
            builder.subscribe_error(lambda line: log.debug("[%s build] %s", self.id, line.rstrip()))
            try:
                env = builder.build()
                activate = self.manifest.plugin.env.activate
                if activate:
                    env = env.activate(activate)
            except (BuildException, OSError, ValueError) as error:
                message = str(error.__cause__ or error)
                self._set(ModelStatus.FAILED, f"Environment build failed: {message}")
                raise BackendError("MODEL_CREATE_FAILED", f"Could not build the environment for {self.id}: {message}")
            self._env = env
            self._set(ModelStatus.READY, None)

    # ── Worker ───────────────────────────────────────────────────────────────

    def service(self) -> Service:
        """The worker process, started on first use."""
        with self._lock:
            if self._service is not None and self._service.is_alive():
                return self._service
            if self._env is None:
                raise BackendError("MODEL_CREATE_FAILED", f"The environment for {self.id} is not built")
            _module, module_dir = self.manifest.entry_module
            service = (
                self._env.python()
                .init(f"import sys\nsys.path.insert(0, {str(module_dir)!r})\nimport numpy\n")
                .debug(self._debug)
            )
            service.exit_timeout = CLOSE_TIMEOUT
            service.start()
            self._service = service
            return service

    def _debug(self, line: str) -> None:
        if self.on_debug is not None:
            self.on_debug(line)
        else:
            log.debug("[%s] %s", self.id, line.rstrip())

    def run(
        self,
        script: str,
        inputs: dict[str, Any],
        *,
        progress: Progress | None = None,
        cancelled: Callable[[], bool] = lambda: False,
        on_update: Callable[[Any], None] | None = None,
    ) -> dict[str, Any]:
        """Runs one task to completion, blocking; run it off the loop.
        Raises ``RequestCancelled`` once ``cancelled()`` turns true, after
        asking the task to stop and killing the worker if it does not.
        ``on_update`` sees every update event, structured ``info`` included."""
        from appose.service import ResponseType, TaskStatus  # noqa: PLC0415

        task = self.service().task(script, inputs)
        done = threading.Event()

        def listen(event: Any) -> None:
            if event.response_type is ResponseType.UPDATE:
                if progress is not None:
                    progress(event.message or "", _percent(event.current, event.maximum))
                if on_update is not None:
                    on_update(event)
            if event.response_type.is_terminal():
                done.set()

        task.listen(listen)
        task.start()
        deadline: float | None = None
        while not done.wait(0.1):
            if deadline is None and cancelled():
                task.cancel()
                deadline = time.monotonic() + CANCEL_GRACE
            elif deadline is not None and time.monotonic() > deadline:
                self.kill("did not stop when cancelled")
                raise RequestCancelled()
        if task.status is TaskStatus.COMPLETE and deadline is None:
            return task.outputs
        if deadline is not None or task.status is TaskStatus.CANCELED:
            raise RequestCancelled()
        error = (task.error or "").strip().splitlines()
        detail = error[-1] if error else "the worker failed"
        log.error("Task on %s failed:\n%s", self.id, task.error)
        raise BackendError("PREDICTION_FAILED", f"{self.id}: {detail}")

    def kill(self, reason: str) -> None:
        with self._lock:
            service, self._service = self._service, None
        if service is not None:
            log.warning("Killing the worker for %s: %s", self.id, reason)
            service.kill()
        self._unloaded_all()

    def close_sync(self) -> None:
        with self._lock:
            service, self._service = self._service, None
        if service is not None:
            service.close(CLOSE_TIMEOUT)
        self._unloaded_all()

    async def close(self) -> None:
        await asyncio.to_thread(self.close_sync)

    @property
    def alive(self) -> bool:
        return self._service is not None and self._service.is_alive()

    def _unloaded_all(self) -> None:
        for model in self.models:
            model._loaded = False
        if self.on_change is not None:
            self.on_change()


class PluginModel(SegmentationModel):
    def __init__(self, spec: ModelSpec, manifest: PluginManifest, service: PluginService) -> None:
        plugin = manifest.plugin
        self.spec = spec
        self.manifest = manifest
        self.service = service
        self.id = spec.id
        self.display_name = spec.display_name
        self.description = spec.description
        self.use = spec.use
        self.sources = spec.sources
        self.cite = spec.cite
        self.cloud_warning = spec.cloud_warning
        self.framework = plugin.framework
        self.version = plugin.version
        self.resources = plugin.resources
        self.tasks = spec.tasks
        self.output_policy = spec.output
        self.channel_policy = spec.channels
        self.option_schema = spec.options
        self.cancellable_load = spec.cancellable_load
        self.last_used = 0.0
        self._loaded = False
        self._failed: str | None = None
        service.models.append(self)

    @property
    def loaded(self) -> bool:
        return self._loaded and self.service.alive

    @property
    def status(self) -> ModelStatus:
        if self.loaded:
            return ModelStatus.LOADED
        if self._failed is not None:
            return ModelStatus.FAILED
        return self.service.status

    @property
    def status_message(self) -> str | None:
        if self.loaded:
            return None
        return self._failed if self._failed is not None else self.service.message

    async def load(self, ctx: HandlerContext) -> None:
        if self.loaded:
            return
        if not appose_available():
            raise BackendError("NOT_SUPPORTED", UNAVAILABLE_MESSAGE)
        loop = asyncio.get_running_loop()

        def progress(message: str, percent: float) -> None:
            # Called on Appose's threads; the context belongs to the loop.
            loop.call_soon_threadsafe(ctx.progress, {"percent": percent, "message": message})

        module, _dir = self.manifest.entry_module
        try:
            await asyncio.to_thread(self.service.build, progress)
            ctx.check_cancelled()
            progress(f"Starting {self.manifest.plugin.name}", -1)
            await asyncio.to_thread(
                self.service.run,
                INSTANTIATE,
                {
                    "key": self.id,
                    "module": module,
                    "attribute": self.spec.attribute,
                    "settings": {"gpu": self.service.gpu},
                },
            )
            progress(f"Loading {self.display_name}", -1)
            await asyncio.to_thread(
                self.service.run,
                LOAD,
                {"key": self.id},
                progress=progress,
                cancelled=lambda: ctx.cancelled,
            )
        except RequestCancelled:
            raise
        except BackendError as error:
            self._failed = error.message
            self._changed()
            raise
        self._failed = None
        self._loaded = True
        self.last_used = time.monotonic()
        self._changed()

    def segment(
        self, image: np.ndarray, options: dict[str, Any], kind_name: str, ctx: HandlerContext
    ) -> list[Detection]:
        if not self.loaded:
            raise RuntimeError("Model not loaded")
        from appose import NDArray  # noqa: PLC0415

        shared = NDArray.copy_of(np.ascontiguousarray(image))
        try:
            outputs = self.service.run(
                SEGMENT,
                {"key": self.id, "image": shared, "options": options},
                cancelled=lambda: ctx.cancelled,
            )
        finally:
            shared.shm.dispose()
        result = outputs["labels"]
        labels = np.array(result)
        # The worker made this block; the service side owns its cleanup.
        result.shm.unlink_on_dispose(True)
        result.shm.dispose()
        self.last_used = time.monotonic()
        return labels_to_detections(labels, kind_name, kind_names=outputs.get("classes"))

    async def unload(self) -> None:
        if self._loaded and self.service.alive:
            try:
                await asyncio.to_thread(self.service.run, UNLOAD, {"key": self.id})
            except BackendError as error:
                log.warning("Unloading %s: %s", self.id, error.message)
        self._loaded = False
        if not any(model._loaded for model in self.service.models):
            await self.service.close()
        self._changed()

    def _changed(self) -> None:
        if self.service.on_change is not None:
            self.service.on_change()


# ── Classifiers ─────────────────────────────────────────────────────────────


def _layers(summary: Any) -> list[ModelLayer] | None:
    if not summary:
        return None
    return [
        ModelLayer(
            layer_name=str(layer.get("layerName", "")),
            output_shape=str(layer.get("outputShape", "")),
            parameters=int(layer.get("parameters", 0)),
            trainable=bool(layer.get("trainable", True)),
        )
        for layer in summary
    ]


class PluginClassifier(ClassificationModel):
    """One classifier's weights, living in the plugin's worker under a key
    of their own; arrays reach the worker as ``.npy`` files it maps."""

    def __init__(self, architecture: PluginClassifierArchitecture) -> None:
        self.architecture = architecture
        self.key = f"{architecture.id}:{uuid.uuid4()}"
        self._instantiated = False
        self._summary: list[ModelLayer] | None = None
        self._device = "cpu"
        self._framework_version = ""

    @property
    def service(self) -> PluginService:
        return self.architecture.service

    def prepare(self, progress: Callable[[str, float], None]) -> None:
        """Builds the environment if needed and puts the model in the worker."""
        self.service.build(progress)
        if self._instantiated and self.service.alive:
            return
        module, _dir = self.architecture.manifest.entry_module
        progress(f"Starting {self.architecture.manifest.plugin.name}", -1)
        self.service.run(
            INSTANTIATE,
            {
                "key": self.key,
                "module": module,
                "attribute": self.architecture.spec.attribute,
                "settings": {"gpu": self.service.gpu},
            },
        )
        self._instantiated = True

    def _about(self, outputs: dict[str, Any]) -> None:
        self._device = str(outputs.get("device") or "cpu")
        self._framework_version = str(outputs.get("frameworkVersion") or "")
        self._summary = _layers(outputs.get("summary"))

    def build(self, num_classes: int, input_shape: Shape, seed: int) -> None:
        self.prepare(lambda _message, _percent: None)
        self._about(
            self.service.run(
                BUILD,
                {
                    "key": self.key,
                    "num_classes": num_classes,
                    "input_shape": [input_shape.channels, input_shape.height, input_shape.width],
                    "seed": seed,
                },
            )
        )

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
        with tempfile.TemporaryDirectory(prefix="piximi-fit-") as folder:
            paths = {}
            for name, array in (("x", x), ("y", y), ("val_x", val_x), ("val_y", val_y)):
                paths[name] = os.path.join(folder, f"{name}.npy")
                np.save(paths[name], np.ascontiguousarray(array))

            def on_update(event: Any) -> None:
                epoch = (event.info or {}).get("epoch") if event.info else None
                if epoch:
                    report(RunHistoryEpoch.model_validate(epoch))

            outputs = self.service.run(
                FIT,
                {"key": self.key, **paths, "options": options.to_wire()},
                cancelled=cancelled,
                on_update=on_update,
            )
        self._about(outputs)
        return RunStatus(outputs.get("status", "completed"))

    def predict(self, x: np.ndarray) -> np.ndarray:
        with tempfile.TemporaryDirectory(prefix="piximi-predict-") as folder:
            path = os.path.join(folder, "x.npy")
            np.save(path, np.ascontiguousarray(x))
            outputs = self.service.run(PREDICT, {"key": self.key, "x": path})
        result = outputs["probabilities"]
        probabilities = np.array(result)
        result.shm.unlink_on_dispose(True)
        result.shm.dispose()
        return probabilities

    def save(self) -> bytes:
        return base64.b64decode(self.service.run(SAVE, {"key": self.key})["data"])

    def load(self, data: bytes) -> None:
        self.prepare(lambda _message, _percent: None)
        self._about(
            self.service.run(LOAD_WEIGHTS, {"key": self.key, "data": base64.b64encode(data).decode("ascii")})
        )

    def summary(self) -> list[ModelLayer] | None:
        return self._summary

    @property
    def device(self) -> str:
        return self._device

    @property
    def framework_version(self) -> str:
        return self._framework_version


class PluginClassifierArchitecture(ClassificationArchitecture):
    """A manifest's classifier: listed with its environment's status, and
    the maker of ``PluginClassifier`` instances in that environment."""

    def __init__(self, spec: ModelSpec, manifest: PluginManifest, service: PluginService) -> None:
        self.spec = spec
        self.manifest = manifest
        self.service = service
        self.id = spec.id
        self.display_name = spec.display_name
        self.description = spec.description
        self.use = spec.use
        self.framework = manifest.plugin.framework
        self.version = manifest.plugin.version
        self.sources = spec.sources
        self.resources = manifest.plugin.resources
        self.channel_policy = spec.channels
        self.tasks = spec.tasks

    @property
    def status(self) -> ModelStatus:
        return self.service.status

    @property
    def status_message(self) -> str | None:
        return self.service.message

    def create(self) -> ClassificationModel:
        if not appose_available():
            raise BackendError("NOT_SUPPORTED", UNAVAILABLE_MESSAGE)
        return PluginClassifier(self)
