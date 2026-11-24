"""``piximi serve <images>``: import a folder of images and serve them, with
the frontend if a build is available. ``piximi serve --connect <engine>``
serves the frontend here and forwards every session to an engine on
another machine instead."""

from __future__ import annotations

import argparse
import asyncio
import importlib.util
import logging
import os
import sys
from collections.abc import Awaitable, Callable
from pathlib import Path

from piximi_link.auth import Auth
from piximi_link.gateway import Upstream, WebSocketUpstream
from piximi_link.server import serve
from piximi_link.session import SessionHub

from .bundle import find_frontend, frontend_version_warning

# Mirrors `piximi_engine.paths.ROOTS_ENV`, which this module must not import
# eagerly: the engine is an optional dependency.
ROOTS_ENV = "PIXIMI_ROOTS"
CONNECT_TOKEN_ENV = "PIXIMI_CONNECT_TOKEN"
ENGINE_MISSING = "The reference engine is not installed here; install `piximi[engine]` to serve images from this machine."


# What only an engine on this machine uses, refused with --connect.
ENGINE_ONLY = {
    "images": "a folder of images",
    "data_dir": "--data-dir",
    "root": "--root",
    "no_gpu": "--no-gpu",
    "models_dir": "--models-dir",
    "envs_dir": "--envs-dir",
}


def upstream_for(target: str, token: str | None, relay: str = "default") -> Upstream:
    """The engine a gateway forwards to, from what ``--connect`` was given."""
    if target.startswith(("ws://", "wss://")):
        return WebSocketUpstream(target, token=token)
    if target.startswith("piximi1."):
        require_iroh()
        from piximi_link.iroh.pairing import Ticket
        from piximi_link.iroh.upstream import IrohUpstream

        try:
            return IrohUpstream(Ticket.parse(target), relay=relay)
        except ValueError as error:
            raise SystemExit(str(error)) from None
    raise SystemExit(f"--connect takes an engine's ws:// or wss:// URL or its piximi1.… ticket, not {target!r}")


def require_iroh() -> None:
    from piximi_link.iroh import INSTALL_HINT, available

    if not available():
        raise SystemExit(INSTALL_HINT)


async def _start_iroh_host(hub: SessionHub, state_dir: Path, relay: str) -> Callable[[], Awaitable[None]]:
    """Serves ``hub`` over iroh too, prints the ticket, and returns how to stop."""
    require_iroh()
    from piximi_link.iroh.host import IrohHost

    def paired(label: str, ticket) -> None:
        print(f"Paired with {label}. A ticket for the next machine: {ticket}", flush=True)

    host = IrohHost(hub, state_dir, relay=relay, on_paired=paired)
    await host.start()
    print(f"Iroh ticket: {host.ticket()}", flush=True)
    print(f"Paired machines are kept in {host.allowlist.path}", flush=True)
    return host.close


async def _serve(args: argparse.Namespace) -> None:
    auth = Auth(None if args.no_auth else (args.token or Auth.generate_token()))
    if args.connect:
        given = [flag for name, flag in ENGINE_ONLY.items() if getattr(args, name)]
        if given:
            raise SystemExit(f"--connect serves an engine elsewhere; drop {', '.join(given)}")
        if args.iroh:
            raise SystemExit("--iroh serves an engine on this machine; --connect forwards to one elsewhere")
        upstream = upstream_for(args.connect, args.connect_token or os.environ.get(CONNECT_TOKEN_ENV), args.relay)
        connect = getattr(upstream, "connect", None)
        if connect is not None:
            # Dial and pair now, so a bad ticket shows before a browser does.
            try:
                await connect()
            except Exception as error:
                await upstream.close()
                raise SystemExit(f"Could not reach the engine: {error}") from None
        await _run(args, auth, hub=None, upstream=upstream, cleanup=[upstream.close])
        return

    # Only "not installed" gets the friendly message; a broken install
    # should fail with its own import error.
    if importlib.util.find_spec("piximi_engine") is None:
        print(ENGINE_MISSING, file=sys.stderr, flush=True)
        raise SystemExit(2)
    from piximi_engine.engine import ReferenceEngine
    from piximi_engine.paths import roots_from_env

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
        engine.scan_folder = images
        added = engine.scan_if_default()
        print(f"Imported {len(added)} new image(s) from {images}", flush=True)

    hub = SessionHub(engine, auth=auth)
    cleanup = [hub.close, engine.close]
    if args.iroh:
        try:
            cleanup.insert(0, await _start_iroh_host(hub, data_dir / "iroh", args.relay))
        except BaseException:
            await hub.close()
            await engine.close()
            raise
    await _run(args, auth, hub=hub, upstream=None, cleanup=cleanup)


async def _run(
    args: argparse.Namespace,
    auth: Auth,
    *,
    hub: SessionHub | None,
    upstream: Upstream | None,
    cleanup: list[Callable[[], Awaitable[None]]],
) -> None:
    """Serves ``hub`` (or forwards to ``upstream``) with the frontend until
    stopped, then runs ``cleanup`` in order."""
    frontend = find_frontend(args.frontend)
    warning = frontend_version_warning(frontend) if frontend is not None else None
    if warning:
        print(f"Warning: {warning}", file=sys.stderr, flush=True)
    served = await serve(
        hub,
        host=args.host,
        port=args.port,
        auth=auth,
        static_dir=frontend,
        allowed_origins=set(args.allow_origin or []),
        base_path=args.base_path,
        upstream=upstream,
    )

    host = args.host
    query = f"?token={auth.token}" if auth.token else ""
    print(f"PORT {served.port}", flush=True)
    print(f"Backend: ws://{host}:{served.port}/ws", flush=True)
    if upstream is not None:
        print(f"Forwarding sessions to {upstream.describe()}", flush=True)
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
        for step in cleanup:
            await step()


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
    run.add_argument(
        "--connect",
        metavar="ENGINE",
        help="Serve the frontend here and forward every session to an engine elsewhere "
        "(its ws:// or wss:// URL, or the piximi1.… ticket `--iroh` prints) instead of running one",
    )
    run.add_argument(
        "--iroh",
        action="store_true",
        help="Also serve the engine over iroh, to gateways on other machines; prints a ticket to "
        "pass to `piximi serve --connect` (needs piximi[iroh])",
    )
    run.add_argument(
        "--relay",
        default="default",
        metavar="RELAY",
        help="iroh relay: default (n0's public relays, rate-limited), disabled, or the URL of "
        "your own iroh-relay",
    )
    run.add_argument(
        "--connect-token",
        metavar="TOKEN",
        help=f"The remote engine's launch token, if it has one (also {CONNECT_TOKEN_ENV})",
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
