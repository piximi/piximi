from enum import StrEnum
from typing import Annotated, Literal

from pydantic import Field

from .base import WireModel

# ── Model policies ──────────────────────────────────────────────────────────


class ChannelPolicyFixed(WireModel):
    """The model needs exactly ``count`` planes; the user maps one image channel
    onto each."""

    mode: Literal["fixed"]
    count: int


class ChannelPolicyPassthrough(WireModel):
    """The model is channel-agnostic and takes up to ``max_channels`` as-is."""

    mode: Literal["passthrough"]
    max_channels: int


ChannelPolicy = Annotated[
    ChannelPolicyFixed | ChannelPolicyPassthrough, Field(discriminator="mode")
]


class OutputPolicySingle(WireModel):
    """Every annotation lands in one kind, named by the user."""

    mode: Literal["single"]
    default_kind_name: str


class OutputPolicyClasses(WireModel):
    """One kind per output class, chosen per detection by the model."""

    mode: Literal["classes"]
    kind_names: list[str]


OutputPolicy = Annotated[
    OutputPolicySingle | OutputPolicyClasses, Field(discriminator="mode")
]

# ── Option schema ───────────────────────────────────────────────────────────
#
# A model's inference knobs, declared as data so a UI can render them without
# knowing the model.


class OptionCondition(WireModel):
    key: str
    equals: str | float | bool


class OptionFieldBase(WireModel):
    key: str
    label: str
    help: str | None = None
    """Key of a help entry the UI may have for this field."""
    tooltip: str | None = None
    advanced: bool | None = None
    visible_when: OptionCondition | None = None


class NumberOptionField(OptionFieldBase):
    type: Literal["number"]
    default: float | None = None
    min: float | None = None
    max: float | None = None
    step: float | None = None
    precision: int | None = None
    optional: bool | None = None
    """Allows an empty input, committed as unset (library default)."""
    empty_label: str | None = None
    control: Literal["text", "slider"] | None = None


class BooleanOptionField(OptionFieldBase):
    type: Literal["boolean"]
    default: bool


class SelectChoice(WireModel):
    value: str
    label: str


class SelectOptionField(OptionFieldBase):
    type: Literal["select"]
    default: str
    choices: list[SelectChoice]


class ChannelIndexOptionField(OptionFieldBase):
    """A 1-based index into the channels sent to the model; ``0`` means
    ``zero_label``."""

    type: Literal["channelIndex"]
    default: int
    zero_label: str


OptionField = Annotated[
    NumberOptionField | BooleanOptionField | SelectOptionField | ChannelIndexOptionField,
    Field(discriminator="type"),
]


class OptionGroup(WireModel):
    id: str
    label: str
    fields: list[OptionField]
    describes_channels: bool | None = None


class OptionSchema(WireModel):
    groups: list[OptionGroup]


OptionValue = float | bool | str | None
OptionValues = dict[str, OptionValue]

# ── Models and runs ─────────────────────────────────────────────────────────


class ModelLink(WireModel):
    text: str
    url: str


class ModelStatus(StrEnum):
    """Where a model is on the way to being usable. A model that runs in its
    own environment starts ``unavailable`` until that environment is built."""

    UNAVAILABLE = "unavailable"
    BUILDING = "building"
    READY = "ready"
    LOADED = "loaded"
    FAILED = "failed"


class ModelTask(StrEnum):
    """What a model can do, named like the capabilities that expose it."""

    SEGMENTATION = "segmentation"
    SEGMENTATION_TRAIN = "segmentation.train"
    CLASSIFICATION = "classification"
    CLASSIFICATION_TRAIN = "classification.train"


class ModelResources(WireModel):
    gpu: bool
    """Whether the model uses a GPU when one is available."""
    memory_hint: str | None = None
    """Free text, e.g. "2 GB VRAM", shown to the user."""


class SegmentationModelDescriptor(WireModel):
    name: str
    """The model's id; what requests refer to."""
    display_name: str
    model_loaded: bool
    """``status == loaded``; kept for the frontend's model details type."""
    status: ModelStatus
    status_message: str | None = None
    """Why the model is ``unavailable`` or ``failed``, or what a build is doing."""
    framework: str
    """What runs the model, e.g. "cellcast", "pytorch", "tensorflow.js"."""
    version: str | None = None
    tasks: list[ModelTask]
    resources: ModelResources | None = None
    output_policy: OutputPolicy
    channel_policy: ChannelPolicy
    option_schema: OptionSchema | None = None
    cancellable_load: bool
    description: str
    use: str
    sources: list[ModelLink]
    cite: list[ModelLink] | None = None
    cloud_warning: str | None = None


class SegmentationRunRequest(WireModel):
    model_id: str
    image_ids: list[str]
    channel_meta_ids: list[str]
    """The channel metas to feed the model, in model-input order; empty means
    every channel in image order."""
    options: OptionValues | None = None
    kind_name: str | None = None


class SegmentationRunSummary(WireModel):
    job_id: str | None = None
    """Absent when the run was cancelled before it started, so no job exists."""
    added: int
    skipped: int
    cancelled: bool
    warnings: list[str] | None = None
