"""The engine behind a SessionHub, driven by a client peer over loopback: the
same calls the frontend's RemoteBackend makes."""

import asyncio

import pytest

from piximi_engine import ReferenceEngine
from piximi_link import BackendError, Peer
from piximi_link.session import SessionHub
from piximi_link.transports import loopback_pair
from piximi_schema import PROTOCOL_VERSION


@pytest.fixture
async def session(engine: ReferenceEngine):
    hub = SessionHub(engine)
    a, b = loopback_pair(64 * 1024)
    server, client = Peer(a), Peer(b)
    hub.attach(server)
    server.start()
    client.start()
    yield hub, client
    await client.close()
    await hub.close()


async def test_initialize_then_query_render_and_segment(session):
    hub, client = session
    init = await client.request(
        "initialize",
        {"protocolVersion": PROTOCOL_VERSION, "clientInfo": {"name": "test", "version": "0"}, "clientCapabilities": []},
    )
    assert init["sessionId"] == hub.session_id
    assert "segmentation" in init["serverCapabilities"]
    client.notify("initialized")

    project = await client.request("query/project")
    assert project["counts"]["images"] == 3 and project["experiment"]["channels"] == 1

    page = await client.request("query/images", {"query": {}, "page": {"limit": 10}})
    assert page["total"] == 3
    record = page["items"][0]
    assert "storageReference" not in record["channels"][0]

    rendered = await client.request(
        "render/image",
        {
            "request": {
                "channels": [
                    {"channelId": ch["id"], "colorMap": [1, 0, 0], "rampMin": 0, "rampMax": 255, "visible": True}
                    for ch in record["channels"]
                ]
            }
        },
    )
    assert isinstance(rendered["data"], bytes) and rendered["mime"] == "image/png"

    events = []
    for name in ("kinds/didAdd", "annotations/didAdd", "jobs/didUpdate"):
        client.on_notification(name, lambda params, name=name: events.append((name, params)))
    progress = []
    summary = await client.request(
        "segmentation/run",
        {"modelId": "threshold", "imageIds": [r["image"]["id"] for r in page["items"]], "channelMetaIds": [], "kindName": "Cell"},
        on_progress=progress.append,
    )
    await asyncio.sleep(0.01)
    assert summary["added"] == 4 and summary["cancelled"] is False
    assert any(name == "annotations/didAdd" and len(params["annotations"]) == 4 for name, params in events)
    assert any(name == "kinds/didAdd" for name, _ in events)
    assert progress and progress[-1]["percent"] == 100

    jobs = await client.request("jobs/list")
    assert jobs["jobs"][-1]["status"] == "succeeded"


async def test_protocol_major_mismatch_is_rejected(session):
    _, client = session
    with pytest.raises(BackendError) as info:
        await client.request(
            "initialize",
            {"protocolVersion": "99.0.0", "clientInfo": {"name": "t", "version": "0"}, "clientCapabilities": []},
        )
    assert info.value.code == "NOT_SUPPORTED"


async def test_invalid_params_are_reported(session):
    _, client = session
    from piximi_link import RpcRemoteError
    from piximi_schema.rpc import INVALID_PARAMS

    with pytest.raises(RpcRemoteError) as info:
        await client.request("query/images", {"query": {}, "page": {"limit": "ten"}})
    assert info.value.code == INVALID_PARAMS
