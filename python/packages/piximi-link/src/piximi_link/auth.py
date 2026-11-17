"""Launch token and session tickets.

The server prints a token with its URL, as Jupyter does. A client exchanges
it over HTTP (``POST /session``) for a short-lived, single-use ticket that it
presents in ``initialize``, so the token never rides on the WebSocket
handshake and a captured ticket is worthless after use. The token itself
stays valid for the server's lifetime, so another tab can open the same URL.
"""

from __future__ import annotations

import secrets
import time

TICKET_TTL_SECONDS = 120


class Auth:
    def __init__(self, token: str | None) -> None:
        self.token = token
        """``None`` disables authentication: every ticket, or none, is accepted."""
        self._tickets: dict[str, float] = {}

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(24)

    @property
    def enabled(self) -> bool:
        return self.token is not None

    def issue_ticket(self, token: str | None) -> str | None:
        """A ticket for a correct token; ``None`` for a wrong one."""
        if self.token is not None and not (
            token is not None and secrets.compare_digest(token, self.token)
        ):
            return None
        self._expire()
        ticket = secrets.token_urlsafe(32)
        self._tickets[ticket] = time.monotonic() + TICKET_TTL_SECONDS
        return ticket

    def redeem(self, ticket: str | None) -> bool:
        """Consumes a ticket; true if it was valid."""
        if self.token is None:
            return True
        if ticket is None:
            return False
        self._expire()
        return self._tickets.pop(ticket, None) is not None

    def _expire(self) -> None:
        now = time.monotonic()
        for ticket, expiry in list(self._tickets.items()):
            if expiry < now:
                del self._tickets[ticket]
