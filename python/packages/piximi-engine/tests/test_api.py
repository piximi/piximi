"""The Python API: what a kernel does with an engine, and that connected
peers hear about it."""

import asyncio
from pathlib import Path

import imageio.v3 as iio
import numpy as np

from piximi_engine import ReferenceEngine
from piximi_engine.api import Project
from piximi_link.notebook import serve
from piximi_link import Peer
from piximi_link.transports.websocket import connect
from piximi_schema import PROTOCOL_VERSION
from piximi_schema.entities import AnnotationVolume


async def test_add_images_reaches_a_connected_peer(engine: ReferenceEngine, tmp_path: Path):
    project = Project(engine)
    session = await serve(engine=engine, auth=False)
    try:
        async with Peer(await connect(session.ws_url)) as client:
            await client.request(
                "initialize",
                {"protocolVersion": PROTOCOL_VERSION, "clientInfo": {"name": "t", "version": "0"}, "clientCapabilities": []},
            )
            added = []
            client.on_notification("images/didAdd", added.append)

            extra = np.zeros((10, 12), dtype=np.uint8)
            extra[2:6, 3:9] = 200
            iio.imwrite(tmp_path / "extra.png", extra)
            ids = project.add_images(tmp_path / "extra.png")

            await asyncio.sleep(0.05)
            assert len(ids) == 1 and len(added) == 1
            record = added[0]["records"][0]
            assert record["image"]["id"] == ids[0] and record["image"]["name"] == "extra"
            assert record["channels"][0]["id"] in engine.pixels
    finally:
        await session.stop()


async def test_project_api_round_trip(engine: ReferenceEngine):
    project = Project(engine)
    names = sorted(image.name for image in project.images)
    assert names == ["a", "b", "c", "d", "e"]
    assert project.pixels("a").shape == (1, 32, 40)
    assert project.pixels("b").shape == (2, 24, 24)
    assert "threshold" in project.models

    summary = await project.segment("threshold", ["a"], kind="Cell")
    assert summary.added == 2
    assert len(project.annotations("a")) == 2
    labels = project.labels("a", kind="Cell")
    assert labels.shape == (32, 40) and labels.max() == 2
    assert (labels[4:12, 4:12] > 0).all()


async def test_project_api_edits_objects_and_kinds(engine: ReferenceEngine):
    import pytest

    from piximi_engine.api import CommitConflictError
    from piximi_schema.unknown import UNKNOWN_KIND_ID

    project = Project(engine)
    kind = await project.create_kind("Nucleus")
    assert project.kind("Nucleus").id == kind.id
    assert (await project.rename_kind(kind, "Nuclei")).name == "Nuclei"

    image = project.image("a")
    mask = np.zeros((image.shape.height, image.shape.width), dtype=bool)
    mask[2:6, 3:8] = True
    added = await project.add_annotation(image, mask, kind="Nuclei")
    assert added.bounding_box == (3, 2, 8, 6) and added.features["area"] == 20 and added.rev is not None
    assert project.labels(image, kind="Nuclei").max() == 1

    # Redrawn in place; a stale copy is refused, then forced through.
    stale = added
    redrawn = await project.set_mask(added, np.ones((2, 3), dtype=bool), bbox=(0, 0, 3, 2))
    assert redrawn.bounding_box == (0, 0, 3, 2) and redrawn.rev > stale.rev
    with pytest.raises(CommitConflictError, match="modified"):
        await project.set_mask(stale, np.ones((2, 2), dtype=bool), bbox=(1, 1, 3, 3))
    forced = await project.set_mask(stale, np.ones((2, 2), dtype=bool), bbox=(1, 1, 3, 3), force=True)
    assert forced.bounding_box == (1, 1, 3, 3)

    assert (await project.rename("Edited")).name == "Edited"
    assert await project.delete_kind("Nuclei") == 1
    assert project.annotation(added.id).id == added.id
    assert engine.meta.get("volume", added.volume_id, AnnotationVolume).kind_id == UNKNOWN_KIND_ID
    assert await project.delete_annotations([added.id]) == 1
    assert project.annotations(image) == []
