"""A gateway: the page's server forwards each session to an engine
elsewhere, checking only the first message."""

import pytest

from piximi_link import BackendError, Peer, RpcRemoteError
from piximi_link.auth import Auth
from piximi_link.gateway import WebSocketUpstream, session_url
from piximi_link.server import serve
from piximi_link.session import SessionHub
from piximi_link.testing.echo_server import register_handlers
from piximi_link.transports.websocket import bound_port, connect
from piximi_link.transports.websocket import serve as serve_websocket
from piximi_schema import PROTOCOL_VERSION

INIT = {"protocolVersion": PROTOCOL_VERSION, "clientInfo": {"name": "t", "version": "0"}, "clientCapabilities": []}


class NoEngine:
    name = "none"
    version = "0"

    def capabilities(self):
        return []

    def subscribe(self, listener):
        return lambda: None


class Counting(WebSocketUpstream):
    opened = 0

    async def open(self):
        self.opened += 1
        return await super().open()


@pytest.fixture
async def engine_server():
    """A hub with its own launch token, as `piximi serve` on another machine."""
    auth = Auth("engine-token")
    hub = SessionHub(NoEngine(), auth=auth)
    served = await serve(hub, auth=auth)
    yield hub, f"ws://127.0.0.1:{served.port}/ws"
    await hub.close()
    await served.stop()


@pytest.fixture
async def gateway(engine_server):
    hub, url = engine_server
    auth = Auth("gateway-token")
    upstream = Counting(url, token="engine-token")
    served = await serve(None, auth=auth, upstream=upstream)
    yield hub, auth, upstream, f"ws://127.0.0.1:{served.port}/ws"
    await served.stop()


def test_session_url_sits_next_to_the_socket():
    assert session_url("ws://host:8000/ws") == "http://host:8000/session"
    assert session_url("wss://lab.example/piximi/ws") == "https://lab.example/piximi/session"


async def test_a_session_reaches_the_engine_with_the_engines_own_ticket(gateway):
    hub, auth, _upstream, url = gateway
    ticket = auth.issue_ticket("gateway-token")
    async with Peer(await connect(url)) as client:
        result = await client.request("initialize", {**INIT, "auth": {"ticket": ticket}})
        assert result["sessionId"] == hub.session_id
        assert await client.request("shutdown") is None, "past the gate upstream"


async def test_a_bad_ticket_never_leaves_the_gateway(gateway):
    _hub, _auth, upstream, url = gateway
    async with Peer(await connect(url)) as client:
        with pytest.raises(BackendError) as info:
            await client.request("initialize", {**INIT, "auth": {"ticket": "forged"}})
        assert info.value.code == "UNAUTHORIZED"
    assert upstream.opened == 0


async def test_a_session_must_start_with_initialize(gateway):
    _hub, _auth, upstream, url = gateway
    async with Peer(await connect(url)) as client:
        with pytest.raises(RpcRemoteError):
            await client.request("shutdown")
    assert upstream.opened == 0


async def test_an_unreachable_engine_is_reported():
    served = await serve(None, upstream=WebSocketUpstream("ws://127.0.0.1:9/ws"))
    try:
        async with Peer(await connect(f"ws://127.0.0.1:{served.port}/ws")) as client:
            with pytest.raises(BackendError) as info:
                await client.request("initialize", INIT)
            assert "Could not reach the engine" in info.value.message
    finally:
        await served.stop()


async def test_everything_after_initialize_passes_through_untouched():
    async def on_connection(transport):
        async with Peer(transport) as peer:
            register_handlers(peer)
            await peer.wait_closed()

    echo = await serve_websocket(on_connection)
    served = await serve(None, upstream=WebSocketUpstream(f"ws://127.0.0.1:{bound_port(echo)}"))
    try:
        url = f"ws://127.0.0.1:{served.port}/ws"
        async with Peer(await connect(url)) as client:
            assert (await client.request("initialize", INIT))["protocolVersion"] == PROTOCOL_VERSION
            blob = bytes(range(256)) * 16 * 1024  # 4 MiB, several frames each way
            result = await client.request("bytes", {"data": blob})
            assert result["length"] == len(blob) and result["data"] == blob
            assert await client.request("echo", {"x": [1]}) == {"x": [1]}
    finally:
        await served.stop()
        echo.close()
        await echo.wait_closed()
