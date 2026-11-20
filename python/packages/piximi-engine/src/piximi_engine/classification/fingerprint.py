"""Identifies a training or validation set by what is in it and how it is
labeled (``core/backend/classification/fingerprint.ts``)."""

from __future__ import annotations

import hashlib
from collections.abc import Iterable


def hash_lines(lines: Iterable[str]) -> str:
    """SHA-256 over the sorted lines joined by newlines, as hex."""
    return hashlib.sha256("\n".join(sorted(lines)).encode()).hexdigest()


def fingerprint_items(items: Iterable[tuple[str, str]]) -> str:
    """``items`` are ``(id, category_id)`` pairs."""
    return hash_lines(f"{id}:{category_id}" for id, category_id in items)


def hash_category_set(category_ids: Iterable[str]) -> str:
    return hash_lines(category_ids)
