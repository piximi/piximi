"""Piximi in a notebook::

    from piximi_engine.notebook import serve
    session = await serve("/path/to/images")   # renders the app in the cell
    session.project.add_images("more.tif")      # appears in the app at once
    await session.project.segment("cellcast-stardist-fluo", channels=[2])

The frontend build is found the same way `piximi serve` finds it: given,
`PIXIMI_FRONTEND_DIR`, or packaged with the engine; without one the session
renders a link for a frontend served elsewhere.
"""

from __future__ import annotations

from pathlib import Path

from piximi_link.notebook import NotebookSession, serve as serve_engine

from .api import Project
from .cli import find_frontend
from .engine import ReferenceEngine


class ProjectSession(NotebookSession):
    def __init__(self, project: Project, base: NotebookSession) -> None:
        super().__init__(base.hub, base._served, base.auth, base.host, base.static_dir)
        self.project = project
        self.engine = project.engine


async def serve(
    images: str | Path | None = None,
    *,
    data_dir: str | Path | None = None,
    engine: ReferenceEngine | None = None,
    frontend: str | Path | None = None,
    host: str = "127.0.0.1",
    port: int = 0,
    token: str | None = None,
    auth: bool = True,
    gpu: bool = True,
    models_dir: str | Path | None = None,
) -> ProjectSession:
    """Serves a folder of images (or an existing engine) from the kernel's
    loop; returns a session whose `.project` is the Python API."""
    if engine is None:
        folder = Path(images).resolve() if images else None
        engine = ReferenceEngine(
            Path(data_dir) if data_dir else (folder or Path.cwd()) / ".piximi",
            gpu=gpu,
            models_dirs=[models_dir] if models_dir else [],
        )
        if folder is not None:
            engine.ingest_folder(folder)
    base = await serve_engine(
        engine,
        host=host,
        port=port,
        token=token,
        auth=auth,
        static_dir=find_frontend(str(frontend) if frontend else None),
    )
    return ProjectSession(Project(engine), base)
