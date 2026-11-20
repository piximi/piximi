"""Plugin manifests: ``piximi-model.toml`` next to a plugin's module.

A manifest declares what the engine needs before the plugin's environment
exists: the plugin's identity, how to build its environment, where its
module is, and each model's description for the UI (policies and option
fields, the same shapes the frontend renders). The module itself only
implements ``load`` and ``segment`` (see ``piximi_model_sdk``).

Keys are ``snake_case``; policies and option fields are the schema's own
models, so a typo fails at registration with a readable message.
"""

from __future__ import annotations

import tomllib
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator
from piximi_schema.segmentation import (
    ChannelPolicy,
    ModelLink,
    ModelResources,
    ModelStatus,
    ModelTask,
    OptionSchema,
    OutputPolicy,
    ModelDescriptor,
)

MANIFEST_NAME = "piximi-model.toml"

ENV_FILES = ("requirements.txt", "pyproject.toml", "pixi.toml", "environment.yml", "environment.yaml")


class ManifestError(Exception):
    """A manifest could not be read or does not describe a plugin."""


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True)


class EnvSpec(_Strict):
    """How to build the plugin's environment: packages for a uv-managed
    virtualenv, or a spec file (requirements.txt, pyproject.toml,
    pixi.toml, environment.yml) next to the manifest."""

    python: str = "3.12"
    requirements: list[str] = []
    file: str | None = None
    activate: str | None = None
    """A named sub-environment to use once built (a pixi environment)."""

    @model_validator(mode="after")
    def _one_source(self) -> EnvSpec:
        if self.file is not None and self.requirements:
            raise ValueError("give either `requirements` or `file`, not both")
        if self.file is None and not self.requirements:
            raise ValueError("an environment needs `requirements` or a `file`")
        if self.file is not None and Path(self.file).name not in ENV_FILES:
            raise ValueError(f"`file` must be one of {', '.join(ENV_FILES)}")
        return self


class PluginInfo(_Strict):
    id: str = Field(pattern=r"^[a-z0-9][a-z0-9._-]*$")
    """Names the environment and worker; models have ids of their own."""
    name: str
    version: str | None = None
    framework: str
    entry: str = "model.py"
    """The module (a ``.py`` file or a package directory) relative to the manifest."""
    env: EnvSpec
    resources: ModelResources | None = None


class ModelSpec(_Strict):
    id: str = Field(pattern=r"^[a-z0-9][a-z0-9._-]*$")
    attribute: str = "MODEL"
    """The ``SegmentationModel`` (instance, class or factory) in the entry module."""
    display_name: str
    description: str = ""
    use: str = ""
    tasks: list[ModelTask] = [ModelTask.SEGMENTATION]
    cancellable_load: bool = False
    output: OutputPolicy
    channels: ChannelPolicy
    options: OptionSchema | None = None
    sources: list[ModelLink] = []
    cite: list[ModelLink] | None = None
    cloud_warning: str | None = None


class PluginManifest(_Strict):
    plugin: PluginInfo
    models: list[ModelSpec] = Field(min_length=1)
    path: Path | None = Field(default=None, exclude=True)
    """Where the manifest was read from; set by ``load_manifest``."""

    @model_validator(mode="after")
    def _distinct_model_ids(self) -> PluginManifest:
        ids = [model.id for model in self.models]
        if len(set(ids)) != len(ids):
            raise ValueError("model ids must be distinct within a manifest")
        return self

    @property
    def dir(self) -> Path:
        if self.path is None:
            raise ManifestError("manifest has no path")
        return self.path.parent

    @property
    def entry_path(self) -> Path:
        return self.dir / self.plugin.entry

    @property
    def entry_module(self) -> tuple[str, Path]:
        """The importable module name and the directory to put on ``sys.path``."""
        path = self.entry_path
        name = path.stem if path.suffix == ".py" else path.name
        return name, path.parent

    @property
    def env_file(self) -> Path | None:
        return None if self.plugin.env.file is None else self.dir / self.plugin.env.file

    def describe(
        self,
        spec: ModelSpec,
        *,
        status: ModelStatus,
        status_message: str | None = None,
    ) -> ModelDescriptor:
        plugin = self.plugin
        return ModelDescriptor(
            name=spec.id,
            display_name=spec.display_name,
            model_loaded=status == ModelStatus.LOADED,
            status=status,
            status_message=status_message,
            framework=plugin.framework,
            version=plugin.version,
            tasks=spec.tasks,
            resources=plugin.resources,
            output_policy=spec.output,
            channel_policy=spec.channels,
            option_schema=spec.options,
            cancellable_load=spec.cancellable_load,
            description=spec.description,
            use=spec.use,
            sources=spec.sources,
            cite=spec.cite,
            cloud_warning=spec.cloud_warning,
        )


def manifest_path(source: Path | str) -> Path:
    """The manifest file for ``source``: the file itself, or the one inside a directory."""
    path = Path(source)
    if path.is_dir():
        path = path / MANIFEST_NAME
    return path


def load_manifest(source: Path | str) -> PluginManifest:
    path = manifest_path(source).resolve()
    if not path.is_file():
        raise ManifestError(f"No {MANIFEST_NAME} at {path.parent}")
    try:
        data = tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError) as error:
        raise ManifestError(f"{path}: {error}") from error
    try:
        manifest = PluginManifest.model_validate(data).model_copy(update={"path": path})
    except ValidationError as error:
        problems = "; ".join(
            f"{'.'.join(str(part) for part in problem['loc'])}: {problem['msg']}" for problem in error.errors()
        )
        raise ManifestError(f"{path}: {problems}") from error
    if not manifest.entry_path.exists():
        raise ManifestError(f"{path}: entry {manifest.plugin.entry} does not exist")
    env_file = manifest.env_file
    if env_file is not None and not env_file.is_file():
        raise ManifestError(f"{path}: environment file {manifest.plugin.env.file} does not exist")
    return manifest
