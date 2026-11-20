"""The Python API and the notebook session: what a kernel does with an
engine, and that connected peers hear about it."""

import asyncio
from pathlib import Path

import imageio.v3 as iio
import numpy as np

from piximi_engine import ReferenceEngine
from piximi_engine.api import Project
from piximi_engine.notebook import serve
from piximi_link import Peer
from piximi_link.transports.websocket import connect
from piximi_schema import PROTOCOL_VERSION


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


async def test_notebook_session_renders_and_serves(images_dir: Path):
    session = await serve(images_dir, token="t0k")
    try:
        assert session.url.endswith("token=t0k") or "token=t0k" in session.url
        assert "t0k" in session._repr_html_()
        assert session.project.engine.meta.count("image") == 5
        assert session.port > 0
    finally:
        await session.stop()
