"""Changes a backend announces after the fact, as ``server -> client``
notifications whose method is the event's ``type``."""

from typing import Annotated, Literal

from pydantic import Field

from .base import WireModel
from .entities import AnnotationCategory, AnnotationObject, AnnotationVolume, Kind
from .jobs import Job


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


BackendEvent = Annotated[
    KindsDidAdd | AnnotationsDidAdd | JobsDidUpdate, Field(discriminator="type")
]

EVENT_TYPES: tuple[type[WireModel], ...] = (KindsDidAdd, AnnotationsDidAdd, JobsDidUpdate)
