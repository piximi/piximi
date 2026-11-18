"""Changes a backend announces after the fact, as ``server -> client``
notifications whose method is the event's ``type``."""

from typing import Annotated, Literal

from pydantic import Field

from .base import WireModel
from .entities import AnnotationCategory, AnnotationObject, AnnotationVolume, ChannelMeta, Kind
from .jobs import Job
from .query import ImageRecord
from .segmentation import SegmentationModelDescriptor


class KindWithCategory(WireModel):
    kind: Kind
    category: AnnotationCategory
    """The kind's unknown category, created alongside it."""


class KindsDidAdd(WireModel):
    type: Literal["kinds/didAdd"]
    kinds: list[KindWithCategory]


class AnnotationsDidAdd(WireModel):
    type: Literal["annotations/didAdd"]
    volumes: list[AnnotationVolume]
    annotations: list[AnnotationObject]


class JobsDidUpdate(WireModel):
    type: Literal["jobs/didUpdate"]
    job: Job


class ImagesDidAdd(WireModel):
    type: Literal["images/didAdd"]
    records: list[ImageRecord]
    channel_metas: list[ChannelMeta]
    """Channel metas created for these images; existing ones are not repeated."""


class ModelsDidChange(WireModel):
    """The model list changed: one was registered, or its status moved (an
    environment built, weights loaded, a failure). Carries the whole list,
    which is short, so a client replaces what it shows."""

    type: Literal["models/didChange"]
    models: list[SegmentationModelDescriptor]


BackendEvent = Annotated[
    KindsDidAdd | AnnotationsDidAdd | JobsDidUpdate | ImagesDidAdd | ModelsDidChange,
    Field(discriminator="type"),
]

EVENT_TYPES: tuple[type[WireModel], ...] = (
    KindsDidAdd,
    AnnotationsDidAdd,
    JobsDidUpdate,
    ImagesDidAdd,
    ModelsDidChange,
)
