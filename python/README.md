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
pnpm build                                 # once: the frontend bundle in dist/
cd python
uv run piximi serve /path/to/images --frontend ../dist
```

This prints a URL with a launch token (`http://127.0.0.1:<port>/?token=…`);
open it and the frontend connects to the server that served it. The project
(SQLite + zarr) lives in `/path/to/images/.piximi`; re-serving the folder
skips files already imported.

Without `--frontend` (or `PIXIMI_FRONTEND_DIR`), open a frontend elsewhere,
such as the Vite dev server, with `?backend=ws://127.0.0.1:<port>/ws&token=…`.
Pages from loopback origins may always connect; add `--allow-origin` for
others, or `--no-auth` to skip the token locally.

A wheel built after `pnpm engine:frontend` carries the frontend inside the
package (`piximi_engine/frontend/`), so an installed `piximi serve` needs no
`--frontend` at all. `uv build --package piximi-engine` writes it to
`python/dist/`. The packaged copy leaves out the in-browser model assets
(ONNX Runtime for Cellpose-SAM, the StarDist/GlaS weights, ~130 MB), since a
served page runs its models on the engine; `node scripts/packageFrontend.mjs
--full` keeps them so the "Continue locally" fallback has every model too.

## From a notebook

Jupyter and marimo run cells on an asyncio loop, and the server shares it,
so the engine is a Python object in the same kernel as your analysis:

```python
from piximi_engine.notebook import serve

session = await serve("/path/to/images")   # the last expression of a cell renders the app
session.project.add_images("more.tif")      # shows up in the app at once
summary = await session.project.segment("cellcast-stardist-fluo", channels=[2])
labels = session.project.labels("cell-painting", kind="Nucleus")   # numpy label image
```

`session.url` is the link to open in a tab, `session.project` the Python
API (`images`, `pixels`, `annotations`, `labels`, `segment`, ...), and
`await session.stop()` ends it. In marimo, `mo.Html(session._repr_html_())`
or `mo.iframe(session.url)` embeds it.

### Jupyter launcher, JupyterHub

With [jupyter-server-proxy](https://jupyter-server-proxy.readthedocs.io/)
installed next to `piximi-engine`, JupyterLab shows a **Piximi** tile that
starts `piximi serve` and proxies it under `<jupyter>/piximi/`. Set
`PIXIMI_IMAGES` (and optionally `PIXIMI_DATA_DIR`) in the Jupyter server's
environment to choose the folder; Jupyter authenticates the path, so the
engine itself runs without a token, on loopback.

A session started from a kernel on JupyterHub is reached the same way:
`session.url` becomes the hub-relative `…/proxy/<port>/` path, and the
inline frame renders through it. The served page learns its prefix from the
proxy's `X-Forwarded-Prefix` header, so nothing needs configuring.

### Mounted in an ASGI app (e.g. alongside marimo)

`create_app` is a Starlette app; mount it under a prefix and tell it where:

```python
import marimo
from starlette.applications import Starlette
from starlette.routing import Mount
from piximi_engine import ReferenceEngine
from piximi_engine.cli import find_frontend
from piximi_link.server import create_app
from piximi_link.session import SessionHub

engine = ReferenceEngine(".piximi")
engine.ingest_folder("images")
notebooks = marimo.create_asgi_app().with_app(path="/", root="analysis.py").build()
app = Starlette(routes=[
    Mount("/piximi", create_app(SessionHub(engine), static_dir=find_frontend(None), base_path="/piximi")),
    Mount("/", notebooks),
])
```

`piximi serve --base-path /piximi` is the same thing for the CLI behind a
proxy that strips the prefix without announcing it.

## Working on the packages

```sh
cd python
uv sync                      # creates .venv with every workspace package
uv run pytest                # all package tests
cd .. && pnpm protocol:gen   # re-export the bundle and regenerate the TS types
pnpm engine:frontend         # build the frontend and copy it into the engine package
PIXIMI_REMOTE_TEST=1 pnpm test --run src/core/backend/remote   # TS ↔ Python, incl. RemoteBackend conformance
```

Both the bundle and the generated TypeScript are checked in; CI regenerates
them and fails on any drift. `src/core/backend/protocol/compat.test.ts` proves
at typecheck time that the generated types still match the frontend's domain
types.
