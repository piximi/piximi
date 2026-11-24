"""Reaching an engine on another machine over iroh (``piximi-link[iroh]``).

An engine's machine runs an ``IrohHost`` next to its hub: an iroh endpoint,
dialled by its public key, so it needs no open port and no public address.
The machine with the browser runs a gateway whose upstream is an
``IrohUpstream``: one QUIC connection to the host, one stream per browser
session, frames forwarded untouched (see ``piximi_link.gateway``). Both
ends are Python, so the browser keeps its plain WebSocket.

Pairing: the host prints a ticket (``piximi1.<endpoint>.<secret>``) whose
secret admits one new machine. The host then remembers that machine's key
(``Allowlist``), so the same ticket keeps working for it after the secret
is spent, and nobody else gets in without a fresh one.

Everything in this package is optional: import it only when iroh is
wanted; ``available()`` says whether it can be, and ``INSTALL_HINT`` how.
"""

from __future__ import annotations

import importlib.util

INSTALL_HINT = "iroh is not installed; install `piximi[iroh]` (or `piximi-link[iroh]`) to use it"


def available() -> bool:
    return importlib.util.find_spec("iroh") is not None
