"""``piximi serve <images>``: import a folder of images and serve them."""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

from piximi_link.server import serve
from piximi_link.session import SessionHub

from .engine import ReferenceEngine


async def _serve(args: argparse.Namespace) -> None:
    images = Path(args.images).resolve() if args.images else None
    data_dir = Path(args.data_dir) if args.data_dir else (images or Path.cwd()) / ".piximi"
    engine = ReferenceEngine(data_dir, gpu=not args.no_gpu)
    if images is not None:
        added = engine.ingest_folder(images)
        print(f"Imported {len(added)} new image(s) from {images}", flush=True)
    hub = SessionHub(engine)
    served = await serve(hub, host=args.host, port=args.port)
    url = f"ws://{args.host}:{served.port}/ws"
    print(f"PORT {served.port}", flush=True)
    print(f"Backend: {url}", flush=True)
    print(f"Open the frontend with ?backend={url}", flush=True)
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
    run.add_argument("--no-gpu", action="store_true", help="Run models on the CPU")
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
