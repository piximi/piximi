"""Projects on a backend that keeps several (``project.io``).

A data directory is a workspace of projects; the backend has one *open* at
a time per session, and every client sees the same one. Opening another,
creating one, or importing a ``.piximi`` file replaces what the clients
hold, which they learn from ``project/didReset`` and answer by loading the
project again from scratch. ``project/export`` hands back the open project
as a ``.piximi`` file (the browser's own format), ``project/import`` takes
one in as a new project.
"""

from typing import Literal

from .base import WireModel
from .entities import Experiment


class ProjectInfo(WireModel):
    id: str
    name: str
    created_at: float
    """Milliseconds since the epoch."""
    opened_at: float | None = None
    current: bool = False
    """The one the session has open."""
    images: int = 0


class ProjectsResult(WireModel):
    projects: list[ProjectInfo]


class ProjectCreateParams(WireModel):
    name: str


class ProjectIdParams(WireModel):
    id: str


class ProjectImportParams(WireModel):
    data: bytes
    """A ``.piximi`` archive."""
    name: str | None = None
    """Overrides the name in the file."""
    progress_token: str | None = None


class ProjectExportParams(WireModel):
    name: str | None = None
    """The file's base name; the project's name when absent."""
    progress_token: str | None = None


class ProjectDidReset(WireModel):
    """The open project was replaced (opened, created or imported); every
    client starts over from ``query/project``."""

    type: Literal["project/didReset"]
    experiment: Experiment
    project: ProjectInfo
