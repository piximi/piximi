"""Editing: what the annotator commits, and the small item updates that
are applied at once.

A viewing session edits a copy of the annotations of a few images and
commits the difference in one changeset. Every entry that touches an
existing row names the revision it was read at (``baseRev``); the backend
refuses the whole changeset when any of them has moved meanwhile, listing
the conflicts, unless the client sends it again with ``force``.
"""

from typing import Literal

from .base import WireModel
from .classification import AnnotationUpdate
from .entities import (
    AnnotationObject,
    AnnotationVolume,
    BBox,
    Experiment,
    ImageObject,
    Kind,
    Partition,
)
from .events import KindWithCategory


class EntityRef(WireModel):
    """An existing row and the revision it was read at; a missing
    ``baseRev`` skips the check (a backend without revisions)."""

    id: str
    base_rev: int | None = None


class VolumeCategoryChange(EntityRef):
    """A recategorized object; the kind follows the category and every
    annotation of the volume follows the partition rule, as
    ``annotations/categorize`` does."""

    category_id: str


class AnnotationGeometryChange(EntityRef):
    """A redrawn object: the bounding box and the mask cropped to it. The
    backend derives the shape and measures the object again."""

    bounding_box: BBox
    encoded_mask: list[int]


class VolumeChanges(WireModel):
    created: list[AnnotationVolume] = []
    """Made by the client with fresh ids; kept as given (revisions assigned)."""
    updated: list[VolumeCategoryChange] = []
    deleted: list[EntityRef] = []
    """Volumes the client dropped; a volume left without annotations by the
    changeset goes regardless, as after ``annotations/delete``."""


class AnnotationChanges(WireModel):
    created: list[AnnotationObject] = []
    """With their masks; features and intensities are measured by the backend."""
    updated: list[AnnotationGeometryChange] = []
    deleted: list[EntityRef] = []


class AnnotationChangeSet(WireModel):
    image_ids: list[str]
    """The images the session edited; every entry belongs to one of them."""
    volumes: VolumeChanges = VolumeChanges()
    annotations: AnnotationChanges = AnnotationChanges()
    force: bool = False
    """Apply even where a ``baseRev`` is stale, overwriting what changed
    meanwhile; an entry whose row is gone is skipped."""


class CommitConflict(WireModel):
    type: Literal["annotation", "volume"]
    id: str
    reason: Literal["modified", "missing"]
    """``modified``: the row's revision is past ``baseRev``; ``missing``:
    the row is gone."""


class CommitResult(WireModel):
    created: int
    updated: int
    deleted: int
    conflicts: list[CommitConflict]
    """Non-empty means nothing was applied (unless the changeset was
    forced, when it lists what was skipped as missing)."""


class AnnotationsCommitParams(AnnotationChangeSet):
    progress_token: str | None = None


# ── Kinds ────────────────────────────────────────────────────────────────────


class KindsCreateParams(WireModel):
    kinds: list[KindWithCategory]
    """Each kind with its unknown category, made by the client with fresh ids."""


class KindUpdateParams(WireModel):
    id: str
    name: str


class KindsDeleteParams(WireModel):
    ids: list[str]
    """Objects of a deleted kind return to the reserved unknown kind and its
    category; the kind's categories and classifiers go with it. The reserved
    unknown kind cannot be deleted."""


class KindsResult(WireModel):
    kinds: list[Kind]


# ── Item updates ─────────────────────────────────────────────────────────────


class ImageChange(WireModel):
    """Fields of an image a user edits directly; absent ones stay."""

    id: str
    name: str | None = None
    partition: Partition | None = None
    active_plane_id: str | None = None


class ImagesUpdateParams(WireModel):
    updates: list[ImageChange]


class AnnotationsUpdateParams(WireModel):
    updates: list[AnnotationUpdate]
    """Partitions set by hand."""


class ProjectUpdateParams(WireModel):
    name: str


class ImagesResult(WireModel):
    images: list[ImageObject]


class ExperimentResult(WireModel):
    experiment: Experiment
