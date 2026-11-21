"""Measurement tables: what the measurement viewer plots and aggregates.

A table covers one scope, every image or the objects of one kind, with the
measurements asked for as columns. Columns are named by key:

- ``feature:<ObjectFeature>`` is a shape feature of an object;
- ``intensity:<IntensityMeasurement>:<channelMetaId>`` is a statistic of the
  pixels in the channel of that meta: under the object's mask, or for an
  image, of its active plane's whole channel.

Values are column-major, aligned with ``ids``, so a client builds plots and
aggregates without walking rows; a value no backend has computed (or a
channel meta the entity's plane lacks) is ``null``. A page addresses a
window of the rows by offset, as the entity listings do, so a large table
can arrive in parts.
"""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from .base import WireModel
from .entities import BBox, IntensityMeasurement, ObjectFeature, Partition
from .query import AnnotationQuery, ImageQuery

MAX_TABLE_PAGE_SIZE = 50_000

FEATURE_PREFIX = "feature:"
INTENSITY_PREFIX = "intensity:"

MeasurementColumn = (
    tuple[Literal["feature"], ObjectFeature] | tuple[Literal["intensity"], IntensityMeasurement, str]
)


def feature_column(feature: ObjectFeature | str) -> str:
    return f"{FEATURE_PREFIX}{ObjectFeature(feature).value}"


def intensity_column(measurement: IntensityMeasurement | str, channel_meta_id: str) -> str:
    return f"{INTENSITY_PREFIX}{IntensityMeasurement(measurement).value}:{channel_meta_id}"


def parse_column(key: str) -> MeasurementColumn:
    """What a column key names; ``ValueError`` for anything else."""
    if key.startswith(FEATURE_PREFIX):
        return ("feature", ObjectFeature(key[len(FEATURE_PREFIX) :]))
    if key.startswith(INTENSITY_PREFIX):
        measurement, _, channel_meta_id = key[len(INTENSITY_PREFIX) :].partition(":")
        if not channel_meta_id:
            raise ValueError(f"An intensity column names a channel meta: {key!r}")
        return ("intensity", IntensityMeasurement(measurement), channel_meta_id)
    raise ValueError(f"Unknown measurement column {key!r}")


class MeasurementScope(WireModel):
    type: Literal["images", "objects"]
    kind_id: str | None = None
    """The kind whose objects are tabled; required for ``objects``."""


class TablePageRequest(WireModel):
    offset: int = Field(default=0, ge=0)
    limit: int = Field(ge=1, le=MAX_TABLE_PAGE_SIZE)


class MeasurementTableRequest(WireModel):
    scope: MeasurementScope
    columns: list[str]
    """Column keys; a key no backend understands is refused as unsupported."""
    image_query: ImageQuery | None = None
    """Restricts an ``images`` scope."""
    annotation_query: AnnotationQuery | None = None
    """Restricts an ``objects`` scope, within its kind."""
    page: TablePageRequest | None = None
    """A window of the rows; absent is all of them."""


class MeasurementTable(WireModel):
    ids: list[str]
    """The entities tabled, in insertion order, or the page's window of them."""
    image_ids: list[str] | None = None
    """For objects, the image each belongs to."""
    image_names: list[str]
    category_ids: list[str]
    partitions: list[Partition]
    timepoints: list[int]
    bounding_boxes: list[BBox] | None = None
    """For objects."""
    values: dict[str, list[float | None]]
    """By column key, aligned with ``ids``."""
    total: int
    """Rows the scope and query match, not of the page."""
