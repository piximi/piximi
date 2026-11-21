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
    skipped: list[str] = []
    """Server paths left alone because they were imported before."""


# ── Files on the backend's own machine ──────────────────────────────────────
#
# A backend that can read its filesystem (``ingest.paths``) lets a client
# browse under a few roots it was started with, look at TIFFs before adding
# them (so the same dimension dialog serves server files), and add files or
# whole folders as an ``ingest`` job.


class EntryType(StrEnum):
    DIRECTORY = "directory"
    FILE = "file"


class DirectoryEntry(WireModel):
    name: str
    path: str
    type: EntryType
    size: int | None = None
    supported: bool = False
    """A file the backend can decode."""


class BrowseParams(WireModel):
    path: str | None = None
    """Absent lists the roots themselves."""


class DirectoryListing(WireModel):
    path: str
    """The directory listed; empty for the roots listing."""
    parent: str | None = None
    """Absent at a root (its parent is the roots listing) and at the top."""
    roots: list[str]
    entries: list[DirectoryEntry]


class InspectParams(WireModel):
    paths: list[str]


class DimensionHint(WireModel):
    """What a TIFF's metadata says about its layout; any field may be
    unknown, and then the dialog asks."""

    dimension_order: DimensionOrder | None = None
    channels: int | None = None
    slices: int | None = None
    frames: int | None = None


class PathInspection(WireModel):
    path: str
    name: str
    frame_count: int
    """2D frames the decoder will see; 1 for anything but a TIFF stack."""
    is_multi_frame: bool
    dimensions: DimensionHint | None = None
    error: str | None = None
    """Why the file could not be looked at; the counts are 0 then."""


class InspectResult(WireModel):
    files: list[PathInspection]


class AddPathsParams(WireModel):
    paths: list[str]
    """Files, or folders whose supported files are added."""
    recursive: bool = False
    """Also the files of a folder's subfolders."""
    dimension_configs: dict[str, DimensionConfig] = {}
    """By file path, for multi-frame TIFFs."""
    progress_token: str | None = None
