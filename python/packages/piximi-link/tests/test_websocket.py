import asyncio

import pytest

from piximi_link import BackendError, Peer, RequestCancelled
from piximi_link.testing.echo_server import register_handlers
from piximi_link.testing.relay import serve_relay
from piximi_link.transports.websocket import bound_port, connect, serve


@pytest.fixture
async def echo_server():
    async def on_connection(transport):
        async with Peer(transport) as peer:
            register_handlers(peer)
            await peer.wait_closed()

    server = await serve(on_connection)
    yield f"ws://127.0.0.1:{bound_port(server)}"
    server.close()
    await server.wait_closed()


async def exercise(uri: str) -> None:
    async with Peer(await connect(uri)) as client:
        assert await client.request("echo", {"x": [1, 2, 3]}) == {"x": [1, 2, 3]}

        blob = bytes(range(256)) * 16 * 1024  # 4 MiB, several frames
        result = await client.request("bytes", {"data": blob})
        assert result["length"] == len(blob) and result["data"] == blob

        seen = []
        assert await client.request("progress", {"steps": [1, 2]}, on_progress=seen.append) == "done"
        assert [v["percent"] for v in seen] == [1, 2]

        cancel = asyncio.Event()
        task = asyncio.create_task(client.request("slow", cancel=cancel))
        await asyncio.sleep(0.05)
        cancel.set()
        with pytest.raises(RequestCancelled):
            await task

        with pytest.raises(BackendError) as info:
            await client.request("fail")
        assert info.value.code == "MODEL_NOT_FOUND"


async def test_peer_over_websocket(echo_server):
    await exercise(echo_server)


async def test_frames_pass_through_a_relay_untouched(echo_server):
    relay = await serve_relay(echo_server)
    try:
        await exercise(f"ws://127.0.0.1:{bound_port(relay)}")
    finally:
        relay.close()
        await relay.wait_closed()
