"""The workspace: several projects in one data dir, one open at a time, and
the ``.piximi`` file that moves a project in and out."""

from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import numpy as np
import pytest
from piximi_engine import ReferenceEngine
from piximi_engine.api import Project
from piximi_engine.project_file import FORMAT_VERSION, ZarrZipReader, read_project
from piximi_engine.store.meta import IncompatibleStoreError
from piximi_engine.workspace import Workspace
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.entities import ImageObject
from piximi_schema.project import ProjectExportParams, ProjectImportParams


def test_workspace_registry_round_trips(tmp_path: Path):
    workspace = Workspace(tmp_path / ".piximi")
    assert workspace.projects == [] and workspace.current is None
    first = workspace.create("First", default=True)
    second = workspace.create("Second")
    workspace.mark_opened(second.id)
    assert workspace.dir(first.id).is_dir() and workspace.dir(second.id).is_dir()
    reopened = Workspace(tmp_path / ".piximi")
    assert [p.name for p in reopened.projects] == ["First", "Second"]
    assert reopened.current is not None and reopened.current.id == second.id
    assert reopened.get(first.id).default and not reopened.get(second.id).default
    reopened.delete(second.id)
    assert reopened.current is None and not workspace.dir(second.id).exists()


def test_an_old_single_project_data_dir_is_refused(tmp_path: Path):
    root = tmp_path / ".piximi"
    root.mkdir()
    (root / "meta.sqlite").write_bytes(b"")
    with pytest.raises(IncompatibleStoreError, match="delete it"):
        Workspace(root)


def test_engine_opens_the_default_project_and_lists_it(engine: ReferenceEngine):
    assert "project.io" in engine.capabilities() and "project.workspace" in engine.capabilities()
    assert engine.project_dir == engine.workspace.dir(engine.project_id)
    assert (engine.project_dir / "meta.sqlite").is_file()


async def test_create_open_delete_switch_the_open_project(engine: ReferenceEngine):
    events = []
    engine.subscribe(events.append)
    [only] = await engine.project_list()
    assert only.current and only.images == 5

    created = await engine.project_create("Scratch")
    assert created.current and created.images == 0 and created.name == "Scratch"
    assert engine.experiment.name == "Scratch" and engine.meta.count("image") == 0
    assert [e.type for e in events] == ["project/didReset"] and events[-1].project.id == created.id

    listed = await engine.project_list()
    assert [(p.name, p.current, p.images) for p in listed] == [(only.name, False, 5), ("Scratch", True, 0)]

    with pytest.raises(BackendError) as info:
        await engine.project_delete(created.id)
    assert info.value.code == "NOT_SUPPORTED"

    reopened = await engine.project_open(only.id)
    assert reopened.current and engine.meta.count("image") == 5 and events[-1].project.id == only.id
    await engine.project_delete(created.id)
    assert [p.id for p in await engine.project_list()] == [only.id]
    with pytest.raises(BackendError) as info:
        await engine.project_open("nope")
    assert info.value.code == "NOT_FOUND"

    # The workspace remembers the open one across engines.
    await engine.close()
    again = ReferenceEngine(engine.data_dir, models={})
    assert again.project_id == only.id and again.meta.count("image") == 5
    await again.close()


async def test_the_served_folder_feeds_only_the_default_project(engine: ReferenceEngine, images_dir: Path):
    engine.scan_folder = images_dir
    assert engine.scan_if_default() == []  # everything already imported
    import imageio.v3 as iio

    iio.imwrite(images_dir / "late.png", np.full((8, 8), 7, dtype=np.uint8))
    created = await engine.project_create("Other")
    assert engine.scan_if_default() == [] and engine.meta.count("image") == 0
    default = next(p for p in await engine.project_list() if p.id != created.id)
    await engine.project_open(default.id)
    assert engine.meta.count("image") == 6


async def test_export_then_import_round_trips_a_project(engine: ReferenceEngine):
    project = Project(engine)
    image = project.images[0]
    mask = np.zeros((image.shape.height, image.shape.width), dtype=bool)
    mask[1:4, 2:6] = True
    annotation = await project.add_annotation(image.id, mask)
    await engine.project_rename("Round trip")

    exported = await engine.project_export(ProjectExportParams(), HandlerContext(None))
    assert exported.file_name == "Round trip.piximi" and exported.mime == "application/zip"
    with zipfile.ZipFile(io.BytesIO(exported.data)) as archive:
        names = archive.namelist()
        assert "Round trip.zarr/" in names and "Round trip.zarr/zarr.json" in names
        reader = ZarrZipReader(archive)
        assert reader.attrs("")["version"] == FORMAT_VERSION
        assert reader.attrs("data")["experiment_name"] == "Round trip"
        channel = engine.meta.list("channel", type(engine.meta.list("image", ImageObject)[0]).__mro__[0]) if False else None
    contents = read_project(exported.data)
    assert len(contents.images) == 5 and len(contents.annotations) == 1
    assert contents.annotations[0].id == annotation.id and contents.annotations[0].encoded_mask == annotation.encoded_mask
    pixels = contents.pixels(contents.channels[0].id)
    assert pixels.shape == (contents.channels[0].height, contents.channels[0].width)
    assert np.array_equal(pixels, engine.pixels.get(contents.channels[0].id))

    events = []
    engine.subscribe(events.append)
    imported = await engine.project_import(ProjectImportParams(data=exported.data, name="Copy"), HandlerContext(None))
    assert imported.current and imported.name == "Copy" and imported.images == 5
    assert events[-1].type == "project/didReset" and events[-1].experiment.name == "Copy"
    assert engine.meta.count("image") == 5 and engine.meta.count("annotation") == 1
    restored = engine.meta.get("annotation", annotation.id, type(annotation))
    assert restored is not None and restored.encoded_mask == annotation.encoded_mask
    first = engine.meta.list("channel", type(contents.channels[0]))[0]
    assert np.array_equal(engine.pixels.get(first.id), contents.pixels(first.id))
    assert sorted(p.name for p in await engine.project_list()) == ["Copy", "Round trip"]


async def test_import_refuses_other_formats(engine: ReferenceEngine):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("old.zarr/", b"")
        archive.writestr("old.zarr/zarr.json", json.dumps({"zarr_format": 3, "node_type": "group", "attributes": {"version": "1.1.0"}}))
    with pytest.raises(ValueError, match="format 2 only"):
        await engine.project_import(ProjectImportParams(data=buffer.getvalue()), HandlerContext(None))
    # Nothing changed: the fixture project is still open.
    assert engine.meta.count("image") == 5 and len(await engine.project_list()) == 1


def test_a_browser_written_project_reads_back():
    """``browser.piximi`` is written by the browser's own writer (see
    ``vectors/gen_project.py`` for how to refresh it)."""
    fixture = Path(__file__).parent / "vectors" / "project" / "browser.piximi"
    contents = read_project(fixture.read_bytes())
    assert contents.experiment.name == "Browser fixture"
    assert sorted(image.name for image in contents.images) == ["img-a", "img-b"]
    assert len(contents.channels) == 4 and len(contents.channel_metas) == 2
    a = next(image for image in contents.images if image.name == "img-a")
    plane = next(p for p in contents.planes if p.image_id == a.id)
    channel = next(c for c in contents.channels if c.plane_id == plane.id)
    pixels = contents.pixels(channel.id)
    assert pixels.shape == (4, 6) and pixels.dtype == np.uint8
    assert contents.classifiers == []
