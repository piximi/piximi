"""Uploads: the streamed ``ingest/open``/``put``/``close`` batch, the TIFF
dimension config, and the decoder's frame order (shared vectors)."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import numpy as np
import pytest
import tifffile
from piximi_engine import ReferenceEngine
from piximi_engine.decode import decode_bytes, frame_index, frames_to_images, tiff_frames
from piximi_link.errors import RequestCancelled
from piximi_link.session import SessionHub
from piximi_link import Peer
from piximi_link.transports import loopback_pair
from piximi_schema import PROTOCOL_VERSION
from piximi_schema.ingest import DimensionConfig, UploadFile
from piximi_schema.jobs import JobStatus
from piximi_schema.query import ImageQuery, PageRequest

VECTORS = Path(__file__).parent / "vectors"
TIFF = VECTORS / "tiff"


def page_value(k: int) -> int:
    return (k + 1) * 100


# ── Decoder ─────────────────────────────────────────────────────────────────


def test_frame_index_matches_the_shared_vectors():
    cases = json.loads((VECTORS / "dims.json").read_text())["cases"]
    assert len(cases) >= 30
    for case in cases:
        sizes = dict(channels=case["channels"], slices=case["slices"], frames=case["frames"])
        for c in range(case["channels"]):
            for z in range(case["slices"]):
                for t in range(case["frames"]):
                    assert frame_index(case["order"], c, z, t, **sizes) == case["index"][c][z][t]


def test_tiff_pages_become_frames_in_page_order_and_rgb_pages_split_per_sample():
    assert [int(f[0, 0]) for f in tiff_frames(TIFF / "pages6.tif")] == [page_value(k) for k in range(6)]
    assert [int(f[0, 0]) for f in tiff_frames(TIFF / "rgb.tif")] == [10, 20, 30]


def test_config_splits_a_stack_by_order():
    frames = tiff_frames(TIFF / "pages6.tif")
    czt = frames_to_images(frames, DimensionConfig(dimension_order="xyczt", channels=2, slices=3, frames=1))
    assert len(czt) == 1 and [p.shape for p in czt[0].planes] == [(2, 4, 4)] * 3
    # xyczt: channel fastest, so plane z holds pages 2z and 2z+1.
    assert [[int(p[c, 0, 0]) for c in range(2)] for p in czt[0].planes] == [[100, 200], [300, 400], [500, 600]]
    zct = frames_to_images(frames, DimensionConfig(dimension_order="xyzct", channels=2, slices=3, frames=1))
    assert [[int(p[c, 0, 0]) for c in range(2)] for p in zct[0].planes] == [[100, 400], [200, 500], [300, 600]]
    # Two timepoints become two images of the same series.
    series = frames_to_images(frames, DimensionConfig(dimension_order="xyczt", channels=1, slices=3, frames=2))
    assert len(series) == 2 and [int(p[0, 0, 0]) for p in series[1].planes] == [400, 500, 600]


def test_config_must_account_for_every_frame():
    with pytest.raises(ValueError, match="needs 4 frames; the file has 6"):
        frames_to_images(tiff_frames(TIFF / "pages6.tif"), DimensionConfig(dimension_order="xyczt", channels=2, slices=2, frames=1))


def test_decode_bytes_handles_pngs_tiffs_and_refuses_garbage(tmp_path: Path):
    png = tmp_path / "gray.png"
    import imageio.v3 as iio

    iio.imwrite(png, np.full((5, 7), 9, dtype=np.uint8))
    [image] = decode_bytes("gray.png", png.read_bytes())
    assert image.channels == 1 and image.shape == (5, 7) and image.bit_depth == 8
    [image] = decode_bytes("x.tif", (TIFF / "pages1.tif").read_bytes())
    assert image.channels == 1 and image.bit_depth == 16
    with pytest.raises(ValueError, match="Unsupported file type"):
        decode_bytes("garbage.bin", (TIFF / "garbage.bin").read_bytes())
    with pytest.raises(ValueError):
        decode_bytes("broken.png", b"\x89PNG not really")


# ── Upload sessions on the engine ───────────────────────────────────────────


def upload(name: str, config: DimensionConfig | None = None) -> UploadFile:
    return UploadFile(name=name, data=(TIFF / name).read_bytes(), dimension_config=config)


async def test_upload_batch_adds_images_and_reports_failures(engine: ReferenceEngine):
    events = []
    engine.subscribe(events.append)
    opened = await engine.ingest_open(3)
    jobs = [e.job for e in events if e.type == "jobs/didUpdate"]
    assert jobs[-1].id == opened.job_id and jobs[-1].status == JobStatus.RUNNING

    one = await engine.ingest_put(opened.upload_id, upload("pages1.tif"))
    assert len(one.image_ids) == 1 and one.error is None
    bad = await engine.ingest_put(opened.upload_id, upload("garbage.bin"))
    assert bad.image_ids == [] and "Unsupported file type" in (bad.error or "")
    stack = await engine.ingest_put(
        opened.upload_id,
        upload("pages6.tif", DimensionConfig(dimension_order="xyzct", channels=2, slices=3, frames=1)),
    )
    assert len(stack.image_ids) == 1

    summary = await engine.ingest_close(opened.upload_id)
    assert summary.job_id == opened.job_id and not summary.cancelled
    assert summary.image_ids == one.image_ids + stack.image_ids
    assert [f.name for f in summary.failed] == ["garbage.bin"]
    jobs = [e.job for e in events if e.type == "jobs/didUpdate" and e.job.id == opened.job_id]
    assert jobs[-1].status == JobStatus.SUCCEEDED and jobs[-1].message == "Added 2 images; 1 file failed"

    added = [e for e in events if e.type == "images/didAdd"]
    assert len(added) == 2
    record = added[1].records[0]
    assert record.image.shape.planes == 3 and record.image.shape.channels == 2 and record.image.bit_depth == 16
    # xyzct on pages 100..600: plane z, channel c holds page z + 3c.
    by_plane = {plane.id: plane.z_index for plane in record.planes}
    values = {(by_plane[ch.plane_id], ch.channel_meta_id): ch.min_value for ch in record.channels}
    assert values[(0, "channel-meta-0")] == 100 and values[(0, "channel-meta-1")] == 400
    assert values[(2, "channel-meta-0")] == 300 and values[(2, "channel-meta-1")] == 600
    assert record.image.active_plane_id == next(p.id for p in record.planes if p.z_index == 1)
    # The fixture project already has three channel metas, wider than this.
    assert added[1].channel_metas == [] and added[1].updated_channel_metas == []


async def test_channel_metas_are_created_from_the_first_file_and_widened_by_later_ones(tmp_path: Path):
    engine = ReferenceEngine(tmp_path / ".piximi", models={})
    events = []
    engine.subscribe(events.append)
    opened = await engine.ingest_open(2)
    await engine.ingest_put(
        opened.upload_id, upload("pages2.tif", DimensionConfig(dimension_order="xyczt", channels=2, slices=1, frames=1))
    )
    await engine.ingest_put(
        opened.upload_id, upload("pages6.tif", DimensionConfig(dimension_order="xyczt", channels=2, slices=3, frames=1))
    )
    await engine.ingest_close(opened.upload_id)
    first, second = [e for e in events if e.type == "images/didAdd"]
    assert [(m.id, m.min_value, m.max_value, m.ramp_max) for m in first.channel_metas] == [
        ("channel-meta-0", 100.0, 100.0, 100.0),
        ("channel-meta-1", 200.0, 200.0, 200.0),
    ]
    assert first.updated_channel_metas == [] and second.channel_metas == []
    # Limits widen (ramp limits with them); the ramp itself is left alone.
    assert [(m.id, m.min_value, m.max_value, m.ramp_max_limit, m.ramp_max) for m in second.updated_channel_metas] == [
        ("channel-meta-0", 100.0, 500.0, 500.0, 100.0),
        ("channel-meta-1", 200.0, 600.0, 600.0, 200.0),
    ]
    assert engine.experiment.channels == 2


async def test_time_frames_become_images_of_one_series(engine: ReferenceEngine):
    opened = await engine.ingest_open(1)
    result = await engine.ingest_put(
        opened.upload_id,
        upload("pages6.tif", DimensionConfig(dimension_order="xyczt", channels=1, slices=3, frames=2)),
    )
    await engine.ingest_close(opened.upload_id)
    page = await engine.images(ImageQuery(ids=result.image_ids), None, PageRequest(limit=10))
    assert len(page.items) == 2
    assert {r.series.id for r in page.items} == {page.items[0].series.id}
    assert page.items[0].series.time_series is True
    assert sorted(r.image.timepoint for r in page.items) == [0, 1]
    assert sorted(r.image.name for r in page.items) == ["pages6-t0", "pages6-t1"]


async def test_cancelling_the_job_refuses_the_next_file(engine: ReferenceEngine):
    opened = await engine.ingest_open(2)
    await engine.ingest_put(opened.upload_id, upload("pages1.tif"))
    engine.jobs.cancel(opened.job_id)
    with pytest.raises(RequestCancelled):
        await engine.ingest_put(opened.upload_id, upload("pages2.tif"))
    summary = await engine.ingest_close(opened.upload_id)
    assert summary.cancelled and len(summary.image_ids) == 1
    assert next(j for j in engine.jobs.list() if j.id == opened.job_id).status == JobStatus.CANCELLED


async def test_a_batch_with_nothing_added_fails_its_job(engine: ReferenceEngine):
    opened = await engine.ingest_open(1)
    await engine.ingest_put(opened.upload_id, upload("garbage.bin"))
    summary = await engine.ingest_close(opened.upload_id)
    job = next(j for j in engine.jobs.list() if j.id == opened.job_id)
    assert job.status == JobStatus.FAILED and "Unsupported file type" in (job.error or "")
    assert summary.image_ids == [] and len(summary.failed) == 1


# ── Over the wire ───────────────────────────────────────────────────────────


@pytest.fixture
async def session(engine: ReferenceEngine):
    hub = SessionHub(engine)
    a, b = loopback_pair(64 * 1024)
    server, client = Peer(a), Peer(b)
    hub.attach(server)
    server.start()
    client.start()
    await client.request(
        "initialize",
        {"protocolVersion": PROTOCOL_VERSION, "clientInfo": {"name": "test", "version": "0"}, "clientCapabilities": []},
    )
    yield hub, server, client
    await client.close()
    await hub.close()


async def test_upload_over_the_wire_declares_the_capability_and_streams_files(session):
    hub, _server, client = session
    assert "ingest.upload" in hub.engine.capabilities()
    opened = await client.request("ingest/open", {"expected": 1})
    put = await client.request(
        "ingest/put",
        {
            "uploadId": opened["uploadId"],
            "file": {
                "name": "pages2.tif",
                "data": (TIFF / "pages2.tif").read_bytes(),
                "dimensionConfig": {"dimensionOrder": "xyczt", "channels": 2, "slices": 1, "frames": 1},
            },
        },
    )
    assert len(put["imageIds"]) == 1
    summary = await client.request("ingest/close", {"uploadId": opened["uploadId"]})
    assert summary["imageIds"] == put["imageIds"] and summary["cancelled"] is False


async def test_a_peer_that_leaves_mid_upload_has_its_job_cancelled(session):
    hub, server, client = session
    opened = await client.request("ingest/open", {"expected": 3})
    await client.request("ingest/put", {"uploadId": opened["uploadId"], "file": {"name": "pages1.tif", "data": (TIFF / "pages1.tif").read_bytes()}})
    hub.detach(server)
    for _ in range(20):
        await asyncio.sleep(0.01)
        job = next(j for j in hub.engine.jobs.list() if j.id == opened["jobId"])
        if job.status == JobStatus.CANCELLED:
            break
    assert job.status == JobStatus.CANCELLED
