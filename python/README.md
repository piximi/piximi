# Piximi Python workspace

A [uv](https://docs.astral.sh/uv/) workspace holding the Python side of
Piximi's pluggable backends.

| Package | Purpose |
| --- | --- |
| `packages/piximi-schema` | The wire contract: Pydantic models for every type that crosses between the frontend and a backend, and the JSON Schema bundle generated from them (`schema/protocol.schema.json`). The frontend's `src/core/backend/protocol/` is generated from that bundle. |
| `packages/piximi-link` | Transport and RPC, independent of what an engine does: msgpack framing that a relay can forward without decoding, a symmetric JSON-RPC peer (requests both ways, progress, cancellation), WebSocket transports, the `Engine` protocol an engine implements, and `SessionHub`, which serves one engine to many peers and broadcasts its events. `piximi-link-echo` serves a test peer; `piximi_link.testing.relay` is a frame-forwarding relay. The frontend's `src/core/backend/remote/` is the same design in TypeScript, and `crossLanguage.test.ts` runs one against the other. |
| `packages/piximi-engine` | The reference engine: metadata in SQLite, pixels in zarr, compositing, RLE masks and measurements matching the frontend's, and a segmentation model registry (a threshold baseline, plus StarDist2D through [cellcast](https://github.com/uw-loci/cellcast) with `pip install 'piximi-engine[cellcast]'`). `piximi serve <folder>` imports a folder of TIFF/PNG/JPEG files and serves them. |

## Serving a folder of images

```sh
cd python
uv run piximi serve /path/to/images        # prints PORT and the ws:// URL
```

Then open the frontend with `?backend=ws://127.0.0.1:<port>/ws`. The project
(SQLite + zarr) lives in `/path/to/images/.piximi`; re-serving the folder
skips files already imported.

## Working on the packages

```sh
cd python
uv sync                      # creates .venv with every workspace package
uv run pytest                # all package tests
cd .. && pnpm protocol:gen   # re-export the bundle and regenerate the TS types
PIXIMI_REMOTE_TEST=1 pnpm test --run src/core/backend/remote   # TS ↔ Python, incl. RemoteBackend conformance
```

Both the bundle and the generated TypeScript are checked in; CI regenerates
them and fails on any drift. `src/core/backend/protocol/compat.test.ts` proves
at typecheck time that the generated types still match the frontend's domain
types.
