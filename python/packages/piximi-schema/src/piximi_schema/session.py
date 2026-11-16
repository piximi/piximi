from .base import WireModel
from .capabilities import Capability


class PeerInfo(WireModel):
    name: str
    version: str


class Auth(WireModel):
    ticket: str
    """Short-lived session ticket obtained by exchanging the launch token."""


class InitializeParams(WireModel):
    protocol_version: str
    client_info: PeerInfo
    client_capabilities: list[str]
    auth: Auth | None = None


class InitializeResult(WireModel):
    protocol_version: str
    server_capabilities: list[Capability]
    session_id: str
    server_info: PeerInfo
