"""An engine's hub reached over iroh, through a gateway, on this machine
(relays off: the tickets carry local addresses). Needs ``piximi-link[iroh]``."""

import asyncio
from pathlib import Path

import pytest

pytest.importorskip("iroh")

from piximi_link import Peer  # noqa: E402
from piximi_link.auth import Auth  # noqa: E402
from piximi_link.iroh.host import IrohHost  # noqa: E402
from piximi_link.iroh.pairing import Ticket  # noqa: E402
from piximi_link.iroh.upstream import IrohUpstream, PairingRefused  # noqa: E402
from piximi_link.server import serve  # noqa: E402
from piximi_link.session import SessionHub  # noqa: E402
from piximi_link.transports.websocket import connect  # noqa: E402
from piximi_schema import PROTOCOL_VERSION  # noqa: E402

INIT = {"protocolVersion": PROTOCOL_VERSION, "clientInfo": {"name": "t", "version": "0"}, "clientCapabilities": []}
BLOB = bytes(range(256)) * 12 * 1024  # 3 MiB: several frames each way


class BlobEngine:
    name = "blob"
    version = "0"

    def capabilities(self):
        return []

    def subscribe(self, listener):
        return lambda: None

    async def project(self):
        return {"blob": BLOB}


@pytest.fixture
async def host(tmp_path: Path):
    hub = SessionHub(BlobEngine(), auth=Auth("never-used"))
    paired = []
    host = IrohHost(hub, tmp_path / "engine", relay="disabled", on_paired=lambda label, t: paired.append(t))
    await host.start()
    yield host, paired
    await host.close()
    await hub.close()


def upstream(ticket: Ticket, tmp_path: Path, name: str) -> IrohUpstream:
    return IrohUpstream(ticket, config_dir=tmp_path / name, relay="disabled")


async def test_a_secret_pairs_one_machine_whose_key_then_suffices(host, tmp_path: Path):
    host, paired = host
    first = host.ticket()
    laptop = upstream(first, tmp_path, "laptop")
    try:
        await laptop.connect()
        assert laptop.session_id == host.hub.session_id
    finally:
        await laptop.close()
    assert len(host.allowlist.entries()) == 1
    assert paired and paired[0].secret != first.secret, "the secret is spent and replaced"

    # The same machine, the same (spent) ticket: admitted by its key.
    again = upstream(first, tmp_path, "laptop")
    try:
        await again.connect()
    finally:
        await again.close()

    # Another machine can't reuse the spent secret, nor come in without one.
    for name, ticket, why in [
        ("desktop", first, "has been used"),
        ("stranger", Ticket(first.endpoint), "not paired"),
    ]:
        other = upstream(ticket, tmp_path, name)
        try:
            with pytest.raises(PairingRefused, match=why):
                await other.connect()
        finally:
            await other.close()
    assert len(host.allowlist.entries()) == 1


async def test_browser_sessions_reach_the_hub_through_a_gateway(host, tmp_path: Path):
    host, _paired = host
    gateway_upstream = upstream(host.ticket(), tmp_path, "laptop")
    served = await serve(None, upstream=gateway_upstream)
    url = f"ws://127.0.0.1:{served.port}/ws"
    try:

        async def session() -> None:
            async with Peer(await connect(url)) as client:
                result = await client.request("initialize", INIT)
                assert result["sessionId"] == host.hub.session_id
                assert (await client.request("query/project"))["blob"] == BLOB

        # Two at once: each is its own stream, and its own peer upstream.
        await asyncio.wait_for(asyncio.gather(session(), session()), 20)
        await asyncio.sleep(0.05)
        assert len(host.hub.peers) == 0, "closed sessions leave the hub"
    finally:
        await served.stop()
        await gateway_upstream.close()
