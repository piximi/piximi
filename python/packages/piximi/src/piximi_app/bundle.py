"""The frontend build this package serves."""

from __future__ import annotations

import json
import os
from pathlib import Path

from piximi_schema import PROTOCOL_VERSION

PACKAGED_FRONTEND = Path(__file__).resolve().parent / "frontend"


def find_frontend(explicit: str | None) -> Path | None:
    """The frontend build to serve: as given, else from PIXIMI_FRONTEND_DIR,
    else the copy packaged with this module, else none."""
    candidates = [explicit, os.environ.get("PIXIMI_FRONTEND_DIR"), str(PACKAGED_FRONTEND)]
    for candidate in candidates:
        if candidate and (Path(candidate) / "index.html").is_file():
            return Path(candidate).resolve()
    return None


def frontend_version_warning(frontend: Path) -> str | None:
    """Why the build at ``frontend`` may not work with this backend: it is
    stamped with the protocol it was built for (``piximi-frontend.json``,
    written by ``pnpm engine:frontend``), and a page of another major would
    fail on the first request whose shape changed."""
    stamp = frontend / "piximi-frontend.json"
    refresh = "run `pnpm engine:frontend` to refresh it"
    if not stamp.is_file():
        return f"The frontend build at {frontend} carries no protocol stamp, so it may predate this backend; {refresh}."
    try:
        version = str(json.loads(stamp.read_text(encoding="utf-8")).get("protocolVersion", ""))
    except (OSError, ValueError):
        return f"The frontend build at {frontend} has an unreadable protocol stamp; {refresh}."
    if version.split(".")[0] != PROTOCOL_VERSION.split(".")[0]:
        return (
            f"The frontend build at {frontend} speaks protocol {version} and this backend "
            f"{PROTOCOL_VERSION}; {refresh}."
        )
    return None
