"""A data directory as a workspace of projects.

    <data_dir>/
      workspace.json            the registry: projects, which is current
      projects/<id>/
        meta.sqlite  pixels.zarr/  classifiers/

The engine holds one project open at a time; the registry remembers it,
so the next start reopens it. The first project a workspace makes is its
*default*: the one the served folder's images are scanned into.
"""

from __future__ import annotations

import json
import shutil
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

from piximi_schema.unknown import generate_uuid

from .store.meta import IncompatibleStoreError

WORKSPACE_FILE = "workspace.json"
PROJECTS_DIR = "projects"


@dataclass
class ProjectEntry:
    id: str
    name: str
    created_at: float
    opened_at: float | None = None
    default: bool = False


@dataclass
class WorkspaceState:
    projects: list[ProjectEntry] = field(default_factory=list)
    current: str | None = None


class Workspace:
    def __init__(self, root: Path | str) -> None:
        self.root = Path(root)
        if (self.root / "meta.sqlite").exists():
            raise IncompatibleStoreError(
                f"{self.root} holds a single project from an earlier engine; delete it (or point "
                "`piximi serve` at a fresh folder) and import the images again"
            )
        self.root.mkdir(parents=True, exist_ok=True)
        self.state = self._load()

    # ── Registry ────────────────────────────────────────────────────────────

    def _load(self) -> WorkspaceState:
        path = self.root / WORKSPACE_FILE
        if not path.is_file():
            return WorkspaceState()
        raw = json.loads(path.read_text(encoding="utf-8"))
        return WorkspaceState(
            projects=[ProjectEntry(**entry) for entry in raw.get("projects", [])],
            current=raw.get("current"),
        )

    def save(self) -> None:
        payload = {"projects": [asdict(entry) for entry in self.state.projects], "current": self.state.current}
        (self.root / WORKSPACE_FILE).write_text(json.dumps(payload, indent=1), encoding="utf-8")

    @property
    def projects(self) -> list[ProjectEntry]:
        return list(self.state.projects)

    def get(self, project_id: str) -> ProjectEntry | None:
        return next((entry for entry in self.state.projects if entry.id == project_id), None)

    @property
    def current(self) -> ProjectEntry | None:
        return self.get(self.state.current) if self.state.current else None

    def dir(self, project_id: str) -> Path:
        return self.root / PROJECTS_DIR / project_id

    # ── Changes ─────────────────────────────────────────────────────────────

    def create(self, name: str, *, default: bool = False) -> ProjectEntry:
        entry = ProjectEntry(id=generate_uuid(), name=name, created_at=time.time() * 1000, default=default)
        self.dir(entry.id).mkdir(parents=True, exist_ok=True)
        self.state.projects.append(entry)
        self.save()
        return entry

    def mark_opened(self, project_id: str) -> ProjectEntry:
        entry = self.get(project_id)
        if entry is None:
            raise KeyError(project_id)
        entry.opened_at = time.time() * 1000
        self.state.current = project_id
        self.save()
        return entry

    def rename(self, project_id: str, name: str) -> None:
        entry = self.get(project_id)
        if entry is not None and entry.name != name:
            entry.name = name
            self.save()

    def delete(self, project_id: str) -> None:
        entry = self.get(project_id)
        if entry is None:
            raise KeyError(project_id)
        self.state.projects = [item for item in self.state.projects if item.id != project_id]
        if self.state.current == project_id:
            self.state.current = None
        self.save()
        shutil.rmtree(self.dir(project_id), ignore_errors=True)
