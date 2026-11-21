"""Changes a backend announces after the fact, as ``server -> client``
notifications whose method is the event's ``type``."""

from typing import Annotated, Literal

from pydantic import Field

from .base import WireModel
from .classification import (
    AnnotationUpdate,
    Classifier,
    ImageUpdate,
    RunHistoryEpoch,
    VolumeUpdate,
)
from .entities import (
    AnnotationCategory,
    AnnotationHeader,
    AnnotationObject,
    AnnotationVolume,
    Category,
    ChannelMeta,
    Experiment,
    ImageObject,
    Kind,
)
from .jobs import Job
from .query import ImageRecord
from .segmentation import ModelDescriptor


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


class ImagesDidRemove(WireModel):
    """Images are gone, with everything under them; the ids are enough for
    a client to drop what it mirrors."""

    type: Literal["images/didRemove"]
    image_ids: list[str]


class AnnotationsDidRemove(WireModel):
    type: Literal["annotations/didRemove"]
    annotation_ids: list[str]
    volume_ids: list[str]
    """Volumes left without annotations, removed along with them."""


class ModelsDidChange(WireModel):
    """The model list changed: one was registered, or its status moved (an
    environment built, weights loaded, a failure). Carries the whole list,
    which is short, so a client replaces what it shows."""

    type: Literal["models/didChange"]
    models: list[ModelDescriptor]


class ImagesDidUpdate(WireModel):
    """Images were categorized, or had partitions or predictions written;
    each update carries the fields a category change rewrites."""

    type: Literal["images/didUpdate"]
    updates: list[ImageUpdate]


class AnnotationsDidUpdate(WireModel):
    """Objects were categorized or had partitions or predictions written:
    the category and prediction live on the volume, the partition on each
    annotation. Objects redrawn or measured by a commit come as whole
    headers; their masks are fetched on demand."""

    type: Literal["annotations/didUpdate"]
    volumes: list[VolumeUpdate]
    annotations: list[AnnotationUpdate]
    headers: list[AnnotationHeader] | None = None


class KindsDidChange(WireModel):
    """A kind was renamed. Carries the whole list, which is short."""

    type: Literal["kinds/didChange"]
    kinds: list[Kind]


class KindsDidRemove(WireModel):
    """Kinds are gone with their categories and classifiers; their objects
    were moved to the reserved unknown kind (announced separately as
    ``annotations/didUpdate``)."""

    type: Literal["kinds/didRemove"]
    kind_ids: list[str]


class ImagesDidChange(WireModel):
    """Images were renamed, re-partitioned by hand or had their active
    plane changed; carries each one whole."""

    type: Literal["images/didChange"]
    images: list[ImageObject]


class ProjectDidChange(WireModel):
    type: Literal["project/didChange"]
    experiment: Experiment


class CategoriesDidChange(WireModel):
    """A category was created, renamed, recoloured or deleted. Carries the
    whole list, which is short, so a client replaces what it holds."""

    type: Literal["categories/didChange"]
    categories: list[Category]


class ClassifiersDidChange(WireModel):
    """A classifier was created, updated, trained, deleted or imported, or a
    job began or finished with it. Carries every classifier of the project."""

    type: Literal["classifiers/didChange"]
    classifiers: list[Classifier]


class ClassifiersDidEpoch(WireModel):
    """One epoch of a training run finished; appended to the run's history."""

    type: Literal["classifiers/didEpoch"]
    classifier_id: str
    run_id: str
    epoch: RunHistoryEpoch


BackendEvent = Annotated[
    KindsDidAdd
    | KindsDidChange
    | KindsDidRemove
    | AnnotationsDidAdd
    | JobsDidUpdate
    | ImagesDidAdd
    | ImagesDidChange
    | ModelsDidChange
    | ImagesDidRemove
    | AnnotationsDidRemove
    | ImagesDidUpdate
    | AnnotationsDidUpdate
    | CategoriesDidChange
    | ProjectDidChange
    | ClassifiersDidChange
    | ClassifiersDidEpoch,
    Field(discriminator="type"),
]

EVENT_TYPES: tuple[type[WireModel], ...] = (
    KindsDidAdd,
    KindsDidChange,
    KindsDidRemove,
    AnnotationsDidAdd,
    JobsDidUpdate,
    ImagesDidAdd,
    ImagesDidChange,
    ModelsDidChange,
    ImagesDidRemove,
    AnnotationsDidRemove,
    ImagesDidUpdate,
    AnnotationsDidUpdate,
    CategoriesDidChange,
    ProjectDidChange,
    ClassifiersDidChange,
    ClassifiersDidEpoch,
)
