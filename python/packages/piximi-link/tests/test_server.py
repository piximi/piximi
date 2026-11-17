"""The HTTP side of the server: token exchange, origin checks, and serving a
frontend bundle with the backend location injected."""

from pathlib import Path

import pytest
from starlette.testclient import TestClient

from piximi_link import BackendError, Peer
from piximi_link.auth import Auth
from piximi_link.server import CONFIG_GLOBAL, create_app, inject_config, origin_allowed
from piximi_link.session import SessionHub
from piximi_link.testing.echo_server import register_handlers
from piximi_link.transports import loopback_pair
from piximi_schema import PROTOCOL_VERSION


class NoEngine:
    """Enough of an engine for the hub to construct."""

    name = "none"
    version = "0"

    def capabilities(self):
        return []

    def subscribe(self, listener):
        return lambda: None


def test_token_exchange_and_ticket_redemption():
    auth = Auth("secret")
    bad = auth.issue_ticket("wrong")
    ticket = auth.issue_ticket("secret")
    assert bad is None and ticket is not None
    assert auth.redeem("nope") is False
    assert auth.redeem(ticket) is True
    assert auth.redeem(ticket) is False, "a ticket is single-use"
    assert Auth(None).redeem(None) is True, "no token means no auth"


def test_origin_policy():
    allowed = {"https://piximi.app"}
    assert origin_allowed(None, "example.org:80", allowed)
    assert origin_allowed("http://localhost:3000", "example.org:80", allowed)
    assert origin_allowed("http://127.0.0.1:5173", "example.org:80", allowed)
    assert origin_allowed("http://example.org:80", "example.org:80", allowed)
    assert origin_allowed("https://piximi.app", "example.org:80", allowed)
    assert not origin_allowed("https://evil.example", "example.org:80", allowed)


def test_inject_config_lands_in_head():
    html = inject_config("<html><head><title>x</title></head><body></body></html>", {"url": "/ws"})
    assert f'window.{CONFIG_GLOBAL} = {{"url": "/ws"}}' in html
    assert html.index(CONFIG_GLOBAL) < html.index("</head>")


def test_session_endpoint_and_static_bundle(tmp_path: Path):
    (tmp_path / "index.html").write_text("<html><head></head><body>app</body></html>")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log(1)")
    hub = SessionHub(NoEngine())
    app = create_app(hub, auth=Auth("secret"), static_dir=tmp_path)

    with TestClient(app) as client:
        assert client.post("/session", json={"token": "wrong"}).status_code == 403
        response = client.post("/session", json={"token": "secret"})
        assert response.status_code == 200 and response.json()["sessionId"] == hub.session_id
        assert client.post(
            "/session", json={"token": "secret"}, headers={"origin": "https://evil.example"}
        ).status_code == 403

        assert client.get("/assets/app.js").text == "console.log(1)"
        assert CONFIG_GLOBAL in client.get("/").text
        assert CONFIG_GLOBAL in client.get("/project").text, "client-side routes get the app"
        assert client.get("/../etc/passwd").status_code in (200, 404)  # never a file outside


async def test_initialize_requires_a_ticket():
    hub = SessionHub(NoEngine(), auth=Auth("secret"))
    a, b = loopback_pair()
    server, client = Peer(a), Peer(b)
    hub.attach(server)
    server.start()
    client.start()
    init = {
        "protocolVersion": PROTOCOL_VERSION,
        "clientInfo": {"name": "t", "version": "0"},
        "clientCapabilities": [],
    }
    try:
        with pytest.raises(BackendError) as info:
            await client.request("initialize", init)
        assert info.value.code == "UNAUTHORIZED"

        ticket = hub.auth.issue_ticket("secret")
        result = await client.request("initialize", {**init, "auth": {"ticket": ticket}})
        assert result["sessionId"] == hub.session_id
    finally:
        await client.close()
        await hub.close()
