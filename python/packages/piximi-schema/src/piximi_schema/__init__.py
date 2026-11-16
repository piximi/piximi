"""The Piximi wire contract.

Every type that crosses between the frontend and a backend is declared here
as a Pydantic model. ``piximi_schema.export`` turns them into one JSON Schema
bundle, from which the frontend generates its TypeScript types, so this
package is the single source of truth for the protocol.
"""

PROTOCOL_VERSION = "1.0.0"
"""Semantic version of the wire contract. A major bump breaks older peers."""
