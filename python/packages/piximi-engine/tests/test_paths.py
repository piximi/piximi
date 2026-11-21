"""Files on the engine's machine: browsing under the roots, looking at
TIFFs before adding them, adding files and folders as a job."""

from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
import pytest
import tifffile
from piximi_engine import ReferenceEngine
from piximi_engine.paths import PathPolicy, dimension_hint, roots_from_env
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.ingest import AddPathsParams, DimensionConfig
from piximi_schema.jobs import JobStatus

TIFF = Path(__file__).parent / "vectors" / "tiff"


@pytest.fixture
def tree(tmp_path: Path) -> Path:
    root = tmp_path / "root"
    (root / "stacks").mkdir(parents=True)
    (root / ".piximi").mkdir()
    (root / ".hidden").write_text("x")
    for name in ("pages6.tif", "pages12.tif", "garbage.bin"):
        shutil.copy(TIFF / name, root / "stacks" / name)
    shutil.copy(TIFF / "pages1.tif", root / "top.tif")
    (root / "notes.txt").write_text("hello")
    (tmp_path / "outside.tif").write_bytes((TIFF / "pages1.tif").read_bytes())
    return root


def test_policy_resolves_only_under_the_roots(tree: Path):
    policy = PathPolicy([tree])
    assert policy.resolve(tree / "stacks") == (tree / "stacks").resolve()
    with pytest.raises(BackendError) as info:
        policy.resolve(tree.parent / "outside.tif")
    assert info.value.code == "UNAUTHORIZED"
    with pytest.raises(BackendError):
        policy.resolve(tree / ".." / "outside.tif")
    assert not PathPolicy([]).enabled


def test_browse_lists_folders_first_and_hides_dotfiles(tree: Path):
    policy = PathPolicy([tree])
    top = policy.browse(None)
    assert top.path == str(tree) and top.parent is None and top.roots == [str(tree)]
    assert [(e.name, e.type.value, e.supported) for e in top.entries] == [
        ("stacks", "directory", False),
        ("notes.txt", "file", False),
        ("top.tif", "file", True),
    ]
    inner = policy.browse(str(tree / "stacks"))
    assert inner.parent == str(tree)
    assert [e.name for e in inner.entries] == ["garbage.bin", "pages12.tif", "pages6.tif"]
    assert inner.entries[1].size and inner.entries[1].size > 0
    with pytest.raises(BackendError) as info:
        policy.browse(str(tree / "nowhere"))
    assert info.value.code == "NOT_FOUND"


def test_several_roots_get_a_roots_listing(tmp_path: Path, tree: Path):
    other = tmp_path / "other"
    other.mkdir()
    policy = PathPolicy([tree, other, tree])
    assert policy.roots == [tree.resolve(), other.resolve()]
    top = policy.browse(None)
    assert top.path == "" and top.parent is None
    assert [e.path for e in top.entries] == [str(tree.resolve()), str(other.resolve())]
    assert policy.browse(str(tree)).parent == ""


def test_roots_from_env_splits_like_path():
    assert roots_from_env({"PIXIMI_ROOTS": "/a:/b"}) == [Path("/a"), Path("/b")] or roots_from_env({"PIXIMI_ROOTS": "/a;/b"}) == [Path("/a"), Path("/b")]
    assert roots_from_env({}) == []


def test_inspect_reports_frames_and_hints(tree: Path, tmp_path: Path):
    hyper = tree / "stacks" / "hyper.tif"
    tifffile.imwrite(hyper, np.zeros((3, 2, 4, 4), np.uint16), imagej=True, metadata={"axes": "ZCYX"})
    rgb = tree / "stacks" / "rgb.tif"
    tifffile.imwrite(rgb, np.zeros((4, 4, 3), np.uint8), photometric="rgb")
    policy = PathPolicy([tree])
    plain, hyperstack, colour, other, missing = policy.inspect(
        [str(tree / "stacks" / "pages6.tif"), str(hyper), str(rgb), str(tree / "stacks" / "garbage.bin"), str(tree / "stacks" / "nope.tif")]
    )
    assert (plain.frame_count, plain.is_multi_frame, plain.dimensions) == (6, True, None)
    assert hyperstack.frame_count == 6 and hyperstack.dimensions is not None
    hint = hyperstack.dimensions
    assert (hint.dimension_order, hint.channels, hint.slices, hint.frames) == ("xyczt", 2, 3, 1)
    assert colour.frame_count == 3 and colour.dimensions is not None and colour.dimensions.channels == 3
    assert (other.frame_count, other.is_multi_frame, other.dimensions) == (1, False, None)
    assert missing.frame_count == 0 and missing.error
    with pytest.raises(BackendError):
        policy.inspect([str(tmp_path / "outside.tif")])


def test_dimension_hint_follows_the_frame_order(tmp_path: Path):
    path = tmp_path / "t.tif"
    # A "shaped" TIFF (tifffile's own metadata) may order the axes freely.
    tifffile.imwrite(path, np.zeros((2, 3, 4, 4), np.uint16), metadata={"axes": "CZYX"})
    with tifffile.TiffFile(path) as tif:
        hint = dimension_hint(tif)
    # Pages are channel-major, so z varies fastest.
    assert hint is not None and hint.dimension_order == "xyzct" and (hint.channels, hint.slices) == (2, 3)


def test_expand_walks_folders(tree: Path):
    policy = PathPolicy([tree])
    assert [p.name for p in policy.expand([str(tree)], recursive=False)] == ["top.tif"]
    assert [p.name for p in policy.expand([str(tree)], recursive=True)] == ["pages12.tif", "pages6.tif", "top.tif"]
    assert [p.name for p in policy.expand([str(tree / "stacks" / "pages6.tif"), str(tree / "stacks")], recursive=False)] == [
        "pages6.tif",
        "pages12.tif",
    ]
    with pytest.raises(BackendError) as info:
        policy.expand([str(tree / "missing.tif")], recursive=False)
    assert info.value.code == "NOT_FOUND"


async def test_add_paths_adds_a_folder_and_skips_it_next_time(tree: Path):
    engine = ReferenceEngine(tree / ".piximi", models={}, roots=[tree])
    assert "ingest.paths" in engine.capabilities()
    events = []
    engine.subscribe(events.append)
    configs = {
        str(tree / "stacks" / "pages6.tif"): DimensionConfig(dimension_order="xyczt", channels=2, slices=3, frames=1),
        str(tree / "stacks" / "pages12.tif"): DimensionConfig(dimension_order="xyczt", channels=2, slices=6, frames=1),
    }
    first = await engine.ingest_add_paths(
        AddPathsParams(paths=[str(tree / "stacks")], dimension_configs=configs), HandlerContext(None)
    )
    assert first.failed == [] and first.skipped == [] and not first.cancelled
    assert len(first.image_ids) == 2
    added = [e for e in events if e.type == "images/didAdd"]
    assert sorted(e.records[0].image.name for e in added) == ["pages12", "pages6"]
    assert sorted(e.records[0].image.shape.planes for e in added) == [3, 6]
    job = next(j for j in engine.jobs.list() if j.id == first.job_id)
    assert job.status == JobStatus.SUCCEEDED and job.message == "Added 2 images"

    again = await engine.ingest_add_paths(AddPathsParams(paths=[str(tree / "stacks")]), HandlerContext(None))
    assert again.image_ids == [] and sorted(Path(p).name for p in again.skipped) == ["pages12.tif", "pages6.tif"]

    # A stack without a config takes the guessed layout; a bad path is refused up front.
    guessed = await engine.ingest_add_paths(AddPathsParams(paths=[str(tree / "top.tif")]), HandlerContext(None))
    assert len(guessed.image_ids) == 1
    with pytest.raises(BackendError):
        await engine.ingest_add_paths(AddPathsParams(paths=[str(tree.parent / "outside.tif")]), HandlerContext(None))


async def test_add_paths_without_roots_is_refused(tmp_path: Path):
    engine = ReferenceEngine(tmp_path / ".piximi", models={})
    assert "ingest.paths" not in engine.capabilities()
    with pytest.raises(BackendError) as info:
        await engine.ingest_browse(None)
    assert info.value.code == "NOT_SUPPORTED"
