"""Bringing images into a project.

A browser upload is one ``ingest`` job per batch, streamed one file at a
time so neither side holds the whole batch: ``ingest/open`` starts the job,
``ingest/put`` sends a file and answers with what it became, ``ingest/close``
finishes the job. A file that cannot be decoded, or whose channel count does
not match the project's, fails alone; the rest of the batch goes on. The
backend announces each file's images as ``images/didAdd``.

The TIFF dimension config is the loader's: how a flat stack of frames maps
to channels, z slices and time frames. The client works it out (metadata
and, if ambiguous, a dialog) and sends it with the file.
"""

from enum import StrEnum

from pydantic import Field

from .base import WireModel


class DimensionOrder(StrEnum):
    """Which index varies fastest in a flat stack of 2D frames, after x and
    y. ``xyczt``: channel fastest, then z, then t."""

    XYCZT = "xyczt"
    XYCTZ = "xyctz"
    XYZCT = "xyzct"
    XYZTC = "xyztc"
    XYTCZ = "xytcz"
    XYTZC = "xytzc"


class DimensionConfig(WireModel):
    dimension_order: DimensionOrder
    channels: int = Field(ge=1)
    slices: int = Field(ge=1)
    frames: int = Field(ge=1)


class UploadFile(WireModel):
    name: str
    mime_type: str | None = None
    """Inferred from the name when absent."""
    data: bytes
    dimension_config: DimensionConfig | None = None
    """Required for a multi-frame TIFF; ignored for other formats."""


class IngestOpenParams(WireModel):
    expected: int = Field(ge=0)
    """How many files will follow, for the job's progress."""


class IngestOpenResult(WireModel):
    upload_id: str
    job_id: str


class IngestPutParams(WireModel):
    upload_id: str
    file: UploadFile


class IngestPutResult(WireModel):
    image_ids: list[str]
    error: str | None = None
    """Why the file was not added; ``image_ids`` is empty then."""


class IngestCloseParams(WireModel):
    upload_id: str
    cancelled: bool = False
    """The client stopped sending; the job ends as cancelled."""


class IngestFailure(WireModel):
    name: str
    error: str


class IngestSummary(WireModel):
    job_id: str | None = None
    """Absent when cancelled before anything started, so no job exists."""
    image_ids: list[str]
    failed: list[IngestFailure]
    cancelled: bool
