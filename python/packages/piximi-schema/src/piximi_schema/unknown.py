"""Identities the frontend and every backend must agree on: the reserved
"Unknown" kind and categories, and the id scheme that marks an id as
representing an unknown category (``src/core/entities/{unknown,identity}.ts``).
"""

from __future__ import annotations

import uuid

from .entities import AnnotationCategory, ImageCategory, Kind

UNKNOWN_IMAGE_CATEGORY_ID = "00000000-0000-0000-0000-000000000000"
UNKNOWN_KIND_ID = "00000000-1111-0000-0000-000000000000"
UNKNOWN_KIND_CATEGORY_ID = "00000000-0000-1111-0000-000000000000"
UNKNOWN_NAME = "Unknown"
UNKNOWN_IMAGE_CATEGORY_COLOR = "#AAAAAA"
UNKNOWN_ANNOTATION_CATEGORY_COLOR = "#920000"

RESERVED_IDS = frozenset({UNKNOWN_IMAGE_CATEGORY_ID, UNKNOWN_KIND_ID, UNKNOWN_KIND_CATEGORY_ID})

UNKNOWN_IMAGE_CATEGORY = ImageCategory(
    type="image",
    id=UNKNOWN_IMAGE_CATEGORY_ID,
    name=UNKNOWN_NAME,
    color=UNKNOWN_IMAGE_CATEGORY_COLOR,
    is_unknown=True,
)
UNKNOWN_KIND = Kind(id=UNKNOWN_KIND_ID, name=UNKNOWN_NAME, unknown_category_id=UNKNOWN_KIND_CATEGORY_ID)
UNKNOWN_KIND_CATEGORY = AnnotationCategory(
    type="annotation",
    id=UNKNOWN_KIND_CATEGORY_ID,
    name=UNKNOWN_NAME,
    color=UNKNOWN_ANNOTATION_CATEGORY_COLOR,
    is_unknown=True,
    kind_id=UNKNOWN_KIND_ID,
)


def generate_uuid(*, defines_unknown: bool = False) -> str:
    """A UUID whose first character marks whether it names an unknown
    category (``0``) or not (``1``), as the frontend's ``generateUUID``."""
    flag = "0" if defines_unknown else "1"
    while True:
        candidate = flag + str(uuid.uuid4())[1:]
        if candidate not in RESERVED_IDS:
            return candidate


def represents_unknown(id: str) -> bool:
    return id[:1] == "0"


def generate_kind(name: str) -> tuple[Kind, AnnotationCategory]:
    """A new kind with its unknown category, as the frontend's ``generateKind``."""
    kind_id = generate_uuid()
    category = AnnotationCategory(
        type="annotation",
        id=generate_uuid(defines_unknown=True),
        name=UNKNOWN_NAME,
        color=UNKNOWN_ANNOTATION_CATEGORY_COLOR,
        is_unknown=True,
        kind_id=kind_id,
    )
    return Kind(id=kind_id, name=name, unknown_category_id=category.id), category
