"""Writes ``project/engine.piximi``: the five fixture images with one
object, exported by the engine, for the browser's reader to open
(``src/core/file-io/project-loader/engineProject.test.ts``). The
counterpart ``project/browser.piximi`` is written by the browser's writer
(``PIXIMI_WRITE_VECTORS=1 pnpm exec vitest run src/core/backend/fake``) and
read by ``tests/test_project.py``.

    uv run python packages/piximi-engine/tests/vectors/gen_project.py
"""

from __future__ import annotations

import asyncio
import tempfile
from pathlib import Path

import numpy as np

from piximi_engine import ReferenceEngine
from piximi_engine.api import Project
from piximi_engine.testing.fixtures import write_fixture_images
from piximi_link.peer import HandlerContext
from piximi_schema.project import ProjectExportParams

HERE = Path(__file__).parent


async def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        images = Path(tmp) / "images"
        write_fixture_images(images)
        engine = ReferenceEngine(Path(tmp) / ".piximi", models={})
        engine.ingest_folder(images)
        project = Project(engine)
        await project.create_kind("Cell")
        first = project.images[0]
        mask = np.zeros((first.shape.height, first.shape.width), dtype=bool)
        mask[2:8, 3:9] = True
        await project.add_annotation(first.id, mask, kind="Cell")
        await engine.project_rename("Engine fixture")
        exported = await engine.project_export(ProjectExportParams(), HandlerContext(None))
        (HERE / "project" / "engine.piximi").write_bytes(exported.data)
        print(f"wrote project/engine.piximi ({len(exported.data)} bytes)")
        await engine.close()


if __name__ == "__main__":
    asyncio.run(main())
