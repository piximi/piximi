"""Taking annotations out of a project as files.

Every export is the same record list, ``ExportedAnnotation``, rendered one
way or another: the Piximi JSON writes the records themselves; COCO turns
each mask into a polygon; the mask formats paint label images, one TIFF per
image and kind (and category, or object, where the format says so), zipped
under the export's name. The frontend's ``core/file-io/export`` and the
engine's ``piximi_engine/export.py`` agree on every layout, so a file
exported from either side looks the same.

Mask formats, with ``<name>/<image>/`` as the folder and uint16 pages, one
per plane, unless stated:

- ``labeledInstances``: ``<kind>.tiff`` and ``<kind>_<category>.tiff``, RGB
  uint8 pages (three per plane, R then G then B) where object ``k`` (1-based,
  per file) is painted ``(k & 255, k >> 8 & 255, k >> 16 & 255)``, so a
  label is ``r + 256 g + 65536 b``.
- ``labeledSemanticMasks``: ``<kind>.tiff``, pixels are the category's
  index (1-based, in order of first appearance within the export).
- ``binaryInstances``: ``<kind>/<category>_<n>.tiff`` per object, 65535
  inside it; ``n`` counts objects of that kind and category across the export.
- ``binarySemanticMasks``: ``<kind>_<category>.tiff``, 65535 inside any
  object of the category.
- ``matrix``: ``<kind>.tiff``, pixels are the object's index (1-based, per
  image and kind, in export order).
"""

from enum import StrEnum

from .base import WireModel
from .entities import BBox, Partition, Shape
from .query import AnnotationQuery


class AnnotationExportType(StrEnum):
    PIXIMI = "piximi"
    COCO = "coco"
    LABELED_INSTANCES = "labeledInstances"
    LABELED_SEMANTIC_MASKS = "labeledSemanticMasks"
    BINARY_INSTANCES = "binaryInstances"
    BINARY_SEMANTIC_MASKS = "binarySemanticMasks"
    MATRIX = "matrix"


class ExportedAnnotation(WireModel):
    """One object as the exporters see it: its geometry plus the names its
    ids stand for, so a file needs nothing else from the project."""

    id: str
    image_id: str
    image_name: str
    image_shape: Shape
    plane_id: str
    plane_index: int
    volume_id: str
    kind_id: str
    kind_name: str
    category_id: str
    category_name: str
    partition: Partition
    timepoint: int
    bounding_box: BBox
    encoded_mask: list[int]
    features: dict[str, float] | None = None
    intensity_measurements: dict[str, dict[str, float]] | None = None


PIXIMI_ANNOTATIONS_FORMAT = "piximi-annotations"
PIXIMI_ANNOTATIONS_VERSION = 1


class AnnotationsExportRequest(WireModel):
    type: AnnotationExportType
    query: AnnotationQuery = AnnotationQuery()
    """Which objects; absent fields do not restrict."""
    name: str | None = None
    """The file's base name and the zip's top folder; the project's name
    when absent."""
    progress_token: str | None = None


class FileExport(WireModel):
    file_name: str
    mime: str
    data: bytes
