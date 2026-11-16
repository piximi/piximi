# Piximi Python workspace

A [uv](https://docs.astral.sh/uv/) workspace holding the Python side of
Piximi's pluggable backends.

| Package | Purpose |
| --- | --- |
| `packages/piximi-schema` | The wire contract: Pydantic models for every type that crosses between the frontend and a backend, and the JSON Schema bundle generated from them (`schema/protocol.schema.json`). The frontend's `src/core/backend/protocol/` is generated from that bundle. |
| `packages/piximi-link` | Transport and RPC, independent of what an engine does: msgpack framing that a relay can forward without decoding, a symmetric JSON-RPC peer (requests both ways, progress, cancellation), and WebSocket transports. `piximi-link-echo` serves a test peer; `piximi_link.testing.relay` is a frame-forwarding relay. The frontend's `src/core/backend/remote/` is the same design in TypeScript, and `crossLanguage.test.ts` runs one against the other. |

## Working on the packages

```sh
cd python
uv sync                      # creates .venv with every workspace package
uv run pytest                # all package tests
cd .. && pnpm protocol:gen   # re-export the bundle and regenerate the TS types
PIXIMI_REMOTE_TEST=1 pnpm test --run src/core/backend/remote   # TS peer ↔ Python peer
```

Both the bundle and the generated TypeScript are checked in; CI regenerates
them and fails on any drift. `src/core/backend/protocol/compat.test.ts` proves
at typecheck time that the generated types still match the frontend's domain
types.
