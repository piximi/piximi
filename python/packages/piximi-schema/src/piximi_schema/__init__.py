"""The Piximi wire contract.

Every type that crosses between the frontend and a backend is declared here
as a Pydantic model. ``piximi_schema.export`` turns them into one JSON Schema
bundle, from which the frontend generates its TypeScript types, so this
package is the single source of truth for the protocol.
"""

PROTOCOL_VERSION = "2.1.0"
"""Semantic version of the wire contract. A major bump breaks older peers:
a server refuses a client of another major at ``initialize``, with a message
naming both, rather than failing on some later request. 1.x paged by keyset
cursor; 2.0 pages by offset and adds deletion and model status; 2.1 adds
classification, categories and item updates."""
