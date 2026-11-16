# Piximi Python workspace

A [uv](https://docs.astral.sh/uv/) workspace holding the Python side of
Piximi's pluggable backends.

| Package | Purpose |
| --- | --- |
| `packages/piximi-schema` | The wire contract: Pydantic models for every type that crosses between the frontend and a backend, and the JSON Schema bundle generated from them (`schema/protocol.schema.json`). The frontend's `src/core/backend/protocol/` is generated from that bundle. |

## Working on the schema

```sh
cd python
uv sync                      # creates .venv with every workspace package
uv run pytest                # schema tests
cd .. && pnpm protocol:gen   # re-export the bundle and regenerate the TS types
```

Both the bundle and the generated TypeScript are checked in; CI regenerates
them and fails on any drift. `src/core/backend/protocol/compat.test.ts` proves
at typecheck time that the generated types still match the frontend's domain
types.
