"""Who may connect: the ticket a host prints, the keys it has paired with,
and the key each machine keeps."""

from __future__ import annotations

import base64
import json
import os
import secrets
import time
from dataclasses import dataclass
from pathlib import Path

TICKET_PREFIX = "piximi1"
SECRET_BYTES = 16
KEY_BYTES = 32


@dataclass(frozen=True)
class Ticket:
    """An iroh endpoint ticket (its key, relay and addresses), and the
    pairing secret, if this ticket still carries one."""

    endpoint: str
    secret: bytes | None = None

    def __str__(self) -> str:
        parts = [TICKET_PREFIX, self.endpoint]
        if self.secret is not None:
            parts.append(base64.b32encode(self.secret).decode().rstrip("=").lower())
        return ".".join(parts)

    @classmethod
    def parse(cls, text: str) -> Ticket:
        parts = text.strip().split(".")
        if parts[0] != TICKET_PREFIX or len(parts) not in (2, 3) or not parts[1]:
            raise ValueError(f"Not a Piximi engine ticket: {text[:24]}…")
        secret = None
        if len(parts) == 3:
            padded = parts[2].upper() + "=" * (-len(parts[2]) % 8)
            secret = base64.b32decode(padded)
        return cls(parts[1], secret)


def looks_like_ticket(text: str) -> bool:
    return text.startswith(TICKET_PREFIX + ".")


def load_or_create_key(path: Path) -> bytes:
    """This machine's iroh secret key: kept, so its endpoint id (and every
    ticket naming it) survives restarts."""
    if path.is_file():
        key = path.read_bytes()
        if len(key) != KEY_BYTES:
            raise ValueError(f"{path} is not an iroh key ({len(key)} bytes); delete it to make a new one")
        return key
    path.parent.mkdir(parents=True, exist_ok=True)
    key = secrets.token_bytes(KEY_BYTES)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(key)
    return key


class Allowlist:
    """The endpoint ids a host has paired with, in a JSON file people may
    read and edit (delete an entry to revoke that machine)."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def _read(self) -> dict[str, dict]:
        if not self.path.is_file():
            return {}
        try:
            value = json.loads(self.path.read_text(encoding="utf-8"))
        except ValueError as error:
            raise ValueError(f"{self.path} is not valid JSON: {error}") from error
        return value if isinstance(value, dict) else {}

    def __contains__(self, endpoint_id: str) -> bool:
        # Read every time: an edit takes effect on the next connection.
        return endpoint_id in self._read()

    def add(self, endpoint_id: str, label: str) -> None:
        entries = self._read()
        entries[endpoint_id] = {"label": label, "addedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")

    def entries(self) -> dict[str, dict]:
        return self._read()


def default_config_dir() -> Path:
    """Where a gateway keeps its own key: ``PIXIMI_CONFIG_DIR``, else
    ``$XDG_CONFIG_HOME/piximi``, else ``~/.config/piximi``."""
    explicit = os.environ.get("PIXIMI_CONFIG_DIR")
    if explicit:
        return Path(explicit)
    base = os.environ.get("XDG_CONFIG_HOME")
    return (Path(base) if base else Path.home() / ".config") / "piximi"
