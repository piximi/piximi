from enum import StrEnum

from .base import WireModel


class JobKind(StrEnum):
    SEGMENTATION = "segmentation"
    MODEL_LOAD = "model-load"
    CLASSIFIER_FIT = "classifier-fit"
    CLASSIFIER_PREDICT = "classifier-predict"


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    STOPPING = "stopping"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job(WireModel):
    """Long-running work on the backend, visible to every client of a session."""

    id: str
    kind: JobKind
    status: JobStatus
    progress: float
    """``0..100``, or ``-1`` while indeterminate."""
    message: str
    cancellable: bool
    """Whether ``jobs/cancel`` can stop it; shown as a control by the UI."""
    error: str | None = None
    started_at: float
    """Milliseconds since the epoch."""
    finished_at: float | None = None
