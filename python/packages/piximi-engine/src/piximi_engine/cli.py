"""``piximi serve <images>``: import a folder of images and serve them, with
the frontend if a build is available."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

from piximi_schema import PROTOCOL_VERSION
from piximi_link.auth import Auth
from piximi_link.server import serve
from piximi_link.session import SessionHub

from .engine import ReferenceEngine
from .paths import ROOTS_ENV, roots_from_env

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
    """Why the build at ``frontend`` may not work with this engine: it is
    stamped with the protocol it was built for (``piximi-frontend.json``,
    written by ``pnpm engine:frontend``), and a page of another major would
    fail on the first request whose shape changed."""
    stamp = frontend / "piximi-frontend.json"
    refresh = "run `pnpm engine:frontend` to refresh it"
    if not stamp.is_file():
        return f"The frontend build at {frontend} carries no protocol stamp, so it may predate this engine; {refresh}."
    try:
        version = str(json.loads(stamp.read_text(encoding="utf-8")).get("protocolVersion", ""))
    except (OSError, ValueError):
        return f"The frontend build at {frontend} has an unreadable protocol stamp; {refresh}."
    if version.split(".")[0] != PROTOCOL_VERSION.split(".")[0]:
        return (
            f"The frontend build at {frontend} speaks protocol {version} and this engine "
            f"{PROTOCOL_VERSION}; {refresh}."
        )
    return None


async def _serve(args: argparse.Namespace) -> None:
    images = Path(args.images).resolve() if args.images else None
    data_dir = Path(args.data_dir) if args.data_dir else (images or Path.cwd()) / ".piximi"
    if args.envs_dir:
        # Read by Appose when it is imported, which the model registry defers until here.
        os.environ["APPOSE_ENVS_DIR"] = str(Path(args.envs_dir).resolve())
    # What a client may browse and add from: the served folder, any --root,
    # PIXIMI_ROOTS, else the working directory.
    roots = [images] if images is not None else []
    roots += [Path(root) for root in args.root or []] + roots_from_env()
    engine = ReferenceEngine(
        data_dir, gpu=not args.no_gpu, models_dirs=args.models_dir or [], roots=roots or [Path.cwd()]
    )
    if images is not None:
        added = engine.ingest_folder(images)
        print(f"Imported {len(added)} new image(s) from {images}", flush=True)

    auth = Auth(None if args.no_auth else (args.token or Auth.generate_token()))
    frontend = find_frontend(args.frontend)
    warning = frontend_version_warning(frontend) if frontend is not None else None
    if warning:
        print(f"Warning: {warning}", file=sys.stderr, flush=True)
    hub = SessionHub(engine, auth=auth)
    served = await serve(
        hub,
        host=args.host,
        port=args.port,
        auth=auth,
        static_dir=frontend,
        allowed_origins=set(args.allow_origin or []),
        base_path=args.base_path,
    )

    host = args.host
    query = f"?token={auth.token}" if auth.token else ""
    print(f"PORT {served.port}", flush=True)
    print(f"Backend: ws://{host}:{served.port}/ws", flush=True)
    if frontend is not None:
        print(f"Open: http://{host}:{served.port}/{query}", flush=True)
    else:
        extra = f"&token={auth.token}" if auth.token else ""
        print(
            f"No frontend build found; open a Piximi frontend with "
            f"?backend=ws://{host}:{served.port}/ws{extra}",
            flush=True,
        )
    try:
        await served.wait()
    finally:
        await hub.close()
        await engine.close()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="piximi")
    commands = parser.add_subparsers(dest="command", required=True)
    run = commands.add_parser("serve", help="Serve a folder of images to the Piximi frontend")
    run.add_argument("images", nargs="?", help="Folder of TIFF/PNG/JPEG files to import")
    run.add_argument("--data-dir", help="Where to keep the project (default: <images>/.piximi)")
    run.add_argument("--host", default="127.0.0.1")
    run.add_argument("--port", type=int, default=0, help="0 picks a free port")
    run.add_argument("--frontend", help="A Piximi frontend build (dist/) to serve at /")
    run.add_argument("--token", help="Launch token (default: generated)")
    run.add_argument("--no-auth", action="store_true", help="Accept connections without a token")
    run.add_argument(
        "--allow-origin",
        action="append",
        metavar="ORIGIN",
        help="Also allow this page origin to connect (loopback origins always may)",
    )
    run.add_argument(
        "--base-path",
        metavar="PATH",
        help="Public path prefix when a proxy strips one (otherwise read from "
        "the X-Forwarded-Prefix header it sends)",
    )
    run.add_argument(
        "--root",
        action="append",
        metavar="DIR",
        help="A folder clients may browse and add images from, besides the served one; "
        f"repeatable (also {ROOTS_ENV}, separated like PATH; default: the working directory)",
    )
    run.add_argument("--no-gpu", action="store_true", help="Run models on the CPU")
    run.add_argument(
        "--models-dir",
        action="append",
        metavar="DIR",
        help="A folder of model plugins (one piximi-model.toml per subfolder); repeatable",
    )
    run.add_argument(
        "--envs-dir",
        metavar="DIR",
        help="Where plugin environments are built (default: APPOSE_ENVS_DIR or ~/.local/share/appose)",
    )
    run.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)
    try:
        asyncio.run(_serve(args))
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
