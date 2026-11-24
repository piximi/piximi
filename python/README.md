# Piximi Python workspace

A [uv](https://docs.astral.sh/uv/) workspace holding the Python side of
Piximi's pluggable backends.

| Package | Purpose |
| --- | --- |
| `packages/piximi-schema` | The wire contract: Pydantic models for every type that crosses between the frontend and a backend, and the JSON Schema bundle generated from them (`schema/protocol.schema.json`). The frontend's `src/core/backend/protocol/` is generated from that bundle. |
| `packages/piximi-link` | Transport and RPC, independent of what an engine does: msgpack framing that a relay can forward without decoding, a symmetric JSON-RPC peer (requests both ways, progress, cancellation), WebSocket transports, the `Engine` protocol an engine implements, and `SessionHub`, which serves one engine to many peers and broadcasts its events. `piximi-link-echo` serves a test peer; `piximi_link.testing.relay` is a frame-forwarding relay. The frontend's `src/core/backend/remote/` is the same design in TypeScript, and `crossLanguage.test.ts` runs one against the other. |
| `packages/piximi-engine` | The reference engine: metadata in SQLite, pixels in zarr, compositing, RLE masks and measurements matching the frontend's, and a model registry: a threshold baseline in process, plus model plugins that each run in their own environment (see below) |
| `packages/piximi` | The application: the `piximi` command, the packaged frontend build, the JupyterLab launcher tile and the notebook helper. `pip install 'piximi[engine]'` brings in the engine, and `piximi serve <folder>` imports a folder of TIFF/PNG/JPEG files and serves them. |
| `packages/piximi-model-sdk` | What a model plugin implements: a `SegmentationModel` base class and a `Context` for progress and cancellation. Depends on numpy alone, so it installs into any plugin environment. |

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
package (`piximi_app/frontend/`), so an installed `piximi serve` needs no
`--frontend` at all. `uv build --package piximi` writes it to
`python/dist/`. The packaged copy leaves out the in-browser model assets
(ONNX Runtime for Cellpose-SAM, the StarDist/GlaS weights, ~130 MB), since a
served page runs its models on the engine; `node scripts/packageFrontend.mjs
--full` keeps them so the "Continue locally" fallback has every model too.

## The engine on another machine

The frontend and the engine need not share a machine. On the machine with
the data and the GPU, serve the engine as usual; on the one you work at,
`piximi serve --connect` serves the frontend and forwards every session to
it, so the browser only ever talks to a local server:

```sh
# compute node: pip install 'piximi[engine]'
piximi serve /path/to/images --host 0.0.0.0 --port 8000 --token <secret>

# interact node: pip install piximi
piximi serve --connect ws://compute-node:8000/ws --connect-token <secret>
```

The gateway checks the page's own launch token and trades the engine's for
a ticket per session (`PIXIMI_CONNECT_TOKEN` works instead of the flag);
everything after a session's `initialize` crosses untouched. Any route to
the engine's port works: the same network, an `ssh -L` tunnel (then
`--connect ws://127.0.0.1:<port>/ws`), or a TLS proxy (`wss://`).

## From a notebook

Jupyter and marimo run cells on an asyncio loop, and the server shares it,
so the engine is a Python object in the same kernel as your analysis:

```python
from piximi_app.notebook import serve

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
installed next to `piximi[engine]`, JupyterLab shows a **Piximi** tile that
starts the engine (through the server's own interpreter, so nothing has to
be on `PATH`) and proxies it under `<jupyter>/piximi/`. Set `PIXIMI_IMAGES`
(and optionally `PIXIMI_DATA_DIR`, `PIXIMI_MODELS_DIR`) in the Jupyter
server's environment to choose the folder, or `PIXIMI_CONNECT` (and
`PIXIMI_CONNECT_TOKEN`) to forward to an engine elsewhere instead; Jupyter authenticates the path,
so the engine itself runs without a token, on loopback. From this
workspace, without installing anything permanently:

```sh
cd python
PIXIMI_IMAGES=/path/to/images uv run --with jupyterlab --with jupyter-server-proxy jupyter lab
```

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
from piximi_app.bundle import find_frontend
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

## Model plugins

A model is a plugin: a folder with a `piximi-model.toml` manifest and a
Python module (see `packages/piximi-model-sdk/README.md` for a complete
one). The manifest declares the plugin's packages and describes each model
to the UI; the engine builds the environment the first time a model is
loaded, through [Appose](https://apposed.org) and uv, and runs the module
in a worker process there. Images and label images cross as arrays in
named shared memory, so no pixel is serialized; a cancel reaches the model
through its context. Nothing the plugin needs is installed next to the
engine, so plugins with conflicting requirements serve one session.

A plugin may also provide classifier architectures: models with the
`classification.train` task and no output policy, implementing the SDK's
`ClassificationModel`. The engine prepares the training set from the
project's labeled items the way the browser does (crop, resize, scale),
writes it as `.npy` files the worker maps without copying, and records each
epoch the model reports; weights round-trip through the worker for the
project's archives. The engine always lists a numpy logistic regression
built in, so a project can be classified without any plugin, and ships the
browser's Simple CNN in PyTorch as a plugin (`torch-cnn`), trained from
scratch on the engine with the same hyperparameters the app offers.

The engine ships two segmenters: StarDist2D through
[cellcast](https://github.com/uw-loci/cellcast) (numpy-only, GPU on macOS
through wgpu) and [Cellpose 3](https://github.com/MouseLand/cellpose) on
PyTorch. Install the runner with `pip install 'piximi[appose]'`
and both are listed; without it, `'piximi[cellcast]'` runs
StarDist2D in the engine's own process instead. In the app, a model whose
environment is not built shows as such, and **Build & Load** builds it
with the build's phases in the task toast.

```sh
uv run piximi serve /path/to/images --models-dir ./my-plugins   # one plugin per subfolder
uv run piximi serve /path/to/images --envs-dir /fast/disk/envs  # where environments are built
```

Environments live under `APPOSE_ENVS_DIR` (default `~/.local/share/appose`)
as `piximi-<plugin id>`, keyed by the manifest's requirements, so a changed
requirement rebuilds on the next load. From a notebook,
`session.project.register_model("./my-plugin")` registers a plugin on the
running engine, and registering it again after an edit replaces it; every
connected tab lists it at once. The Jupyter launcher reads
`PIXIMI_MODELS_DIR`. Installed packages advertise plugins through the
`piximi.models` entry point group, whose value is the manifest's path.

Appose is pinned to an upstream commit (see `pyproject.toml`): the PyPI
release predates the worker handshake and shutdown fixes the runner needs,
and a plugin environment receives the same pin, since a worker must match
the service's minor version.

## Working on the packages

```sh
cd python
uv sync                      # creates .venv with every workspace package
uv run pytest                # all package tests
cd .. && pnpm protocol:gen   # re-export the bundle and regenerate the TS types
pnpm engine:frontend         # build the frontend and copy it into the engine package
PIXIMI_REMOTE_TEST=1 pnpm test --run src/core/backend/remote   # TS ↔ Python, incl. RemoteBackend conformance
PIXIMI_APPOSE_TEST=1 uv run pytest   # also builds plugin environments (two fixture plugins, cellcast)
PIXIMI_CELLPOSE_TEST=1 uv run pytest -k cellpose   # builds the Cellpose environment (PyTorch, ~1 GB)
```

Both the bundle and the generated TypeScript are checked in; CI regenerates
them and fails on any drift. `src/core/backend/protocol/compat.test.ts` proves
at typecheck time that the generated types still match the frontend's domain
types.
