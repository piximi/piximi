"""Annotation exports, laid out as ``piximi_schema.exports`` documents and
as the browser's ``core/file-io/export`` writes them."""

from __future__ import annotations

import io
import json
import zipfile
from collections.abc import Iterable
from datetime import datetime
from pathlib import PurePosixPath

import numpy as np
import tifffile
from piximi_schema.exports import (
    PIXIMI_ANNOTATIONS_FORMAT,
    PIXIMI_ANNOTATIONS_VERSION,
    AnnotationExportType,
    ExportedAnnotation,
    FileExport,
)
from skimage import measure

from .rle import decode_mask

FULL = 65535


def _sanitize(name: str) -> str:
    return name.replace("/", "_").replace("\\", "_")


# ── Piximi JSON ──────────────────────────────────────────────────────────────


def piximi_json(annotations: Iterable[ExportedAnnotation], name: str) -> bytes:
    payload = {
        "format": PIXIMI_ANNOTATIONS_FORMAT,
        "version": PIXIMI_ANNOTATIONS_VERSION,
        "project": name,
        "annotations": [annotation.to_wire() for annotation in annotations],
    }
    return json.dumps(payload).encode("utf-8")


# ── COCO ─────────────────────────────────────────────────────────────────────


def _polygon(mask: np.ndarray, x0: int, y0: int) -> list[float]:
    """The object's outer contour as COCO's flat ``[x1, y1, x2, y2, ...]``,
    in image coordinates."""
    padded = np.pad(mask.astype(np.float32), 1)
    contours = measure.find_contours(padded, 0.5)
    if not contours:
        return []
    outer = max(contours, key=len)
    points: list[float] = []
    for row, col in outer:
        points.extend((float(col) - 1 + x0, float(row) - 1 + y0))
    return points


def coco_json(annotations: Iterable[ExportedAnnotation], version: str) -> bytes:
    images: dict[str, dict] = {}
    categories: dict[str, dict] = {}
    records = []
    for ann in annotations:
        if ann.image_id not in images:
            images[ann.image_id] = {
                "id": len(images),
                "width": ann.image_shape.width,
                "height": ann.image_shape.height,
                "file_name": ann.image_name,
                "license": 0,
                "flickr_url": "",
                "coco_url": "",
                "date_captured": "",
            }
        if ann.category_id not in categories:
            categories[ann.category_id] = {
                "id": len(categories),
                "name": ann.category_name,
                "supercategory": ann.kind_name,
            }
        x0, y0, x1, y1 = ann.bounding_box
        mask = decode_mask(ann.encoded_mask, (y1 - y0, x1 - x0))
        records.append(
            {
                "id": len(records),
                "image_id": images[ann.image_id]["id"],
                "category_id": categories[ann.category_id]["id"],
                "segmentation": [_polygon(mask, x0, y0)],
                "area": int(np.count_nonzero(mask)),
                "bbox": [x0, y0, x1 - x0, y1 - y0],
                "iscrowd": 0,
            }
        )
    payload = {
        "info": {
            "year": datetime.now().year,
            "version": version,
            "description": "",
            "contributor": "",
            "url": "",
            "date_created": "",
        },
        "images": list(images.values()),
        "categories": list(categories.values()),
        "annotations": records,
        "licenses": [{"id": 0, "name": "", "url": ""}],
    }
    return json.dumps(payload).encode("utf-8")


# ── Mask images ──────────────────────────────────────────────────────────────


def _new_image(ann: ExportedAnnotation, rgb: bool) -> np.ndarray:
    shape = ann.image_shape
    pages = shape.planes * 3 if rgb else shape.planes
    return np.zeros((pages, shape.height, shape.width), dtype=np.uint8 if rgb else np.uint16)


def _paint(image: np.ndarray, ann: ExportedAnnotation, value: int, rgb: bool) -> None:
    x0, y0, x1, y1 = ann.bounding_box
    _pages, height, width = image.shape
    mask = decode_mask(ann.encoded_mask, (y1 - y0, x1 - x0)).astype(bool)
    # Clipped to the image, as the browser does.
    cx1, cy1 = min(x1, width), min(y1, height)
    if cx1 <= x0 or cy1 <= y0:
        return
    region = mask[: cy1 - y0, : cx1 - x0]
    if rgb:
        for c, byte in enumerate((value & 255, (value >> 8) & 255, (value >> 16) & 255)):
            page = image[ann.plane_index * 3 + c]
            page[y0:cy1, x0:cx1][region] = byte
    else:
        image[ann.plane_index][y0:cy1, x0:cx1][region] = value


def layout_masks(annotations: Iterable[ExportedAnnotation], export_type: AnnotationExportType) -> dict[str, np.ndarray]:
    """Which files an export writes and what each object paints into them;
    paths are relative to the export's top folder."""
    files: dict[str, np.ndarray] = {}
    rgb = export_type == AnnotationExportType.LABELED_INSTANCES

    def file_for(ann: ExportedAnnotation, path: str) -> np.ndarray:
        if path not in files:
            files[path] = _new_image(ann, rgb)
        return files[path]

    per_file: dict[str, int] = {}

    def next_in(path: str) -> int:
        per_file[path] = per_file.get(path, 0) + 1
        return per_file[path]

    per_category: dict[tuple[str, str], int] = {}
    category_index: dict[str, dict[str, int]] = {}

    for ann in annotations:
        image, kind, category = _sanitize(ann.image_name), _sanitize(ann.kind_name), _sanitize(ann.category_name)
        if export_type == AnnotationExportType.LABELED_INSTANCES:
            kind_path = f"{image}/{kind}.tiff"
            _paint(file_for(ann, kind_path), ann, next_in(kind_path), True)
            category_path = f"{image}/{kind}_{category}.tiff"
            _paint(file_for(ann, category_path), ann, next_in(category_path), True)
        elif export_type == AnnotationExportType.LABELED_SEMANTIC_MASKS:
            indices = category_index.setdefault(ann.kind_id, {})
            index = indices.setdefault(ann.category_id, len(indices) + 1)
            _paint(file_for(ann, f"{image}/{kind}.tiff"), ann, index, False)
        elif export_type == AnnotationExportType.BINARY_INSTANCES:
            key = (ann.kind_id, ann.category_id)
            n = per_category.get(key, 0)
            per_category[key] = n + 1
            _paint(file_for(ann, f"{image}/{kind}/{category}_{n}.tiff"), ann, FULL, False)
        elif export_type == AnnotationExportType.BINARY_SEMANTIC_MASKS:
            _paint(file_for(ann, f"{image}/{kind}_{category}.tiff"), ann, FULL, False)
        elif export_type == AnnotationExportType.MATRIX:
            path = f"{image}/{kind}.tiff"
            _paint(file_for(ann, path), ann, next_in(path), False)
        else:
            raise ValueError(f"{export_type} is not a mask export")
    return files


def encode_tiff(image: np.ndarray) -> bytes:
    """An uncompressed multi-page TIFF, one page per plane (or colour)."""
    buffer = io.BytesIO()
    tifffile.imwrite(buffer, image, photometric="minisblack", contiguous=True)
    return buffer.getvalue()


def masks_zip(annotations: Iterable[ExportedAnnotation], export_type: AnnotationExportType, name: str) -> bytes:
    root = _sanitize(name)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for path, image in layout_masks(annotations, export_type).items():
            archive.writestr(str(PurePosixPath(root) / path), encode_tiff(image))
    return buffer.getvalue()


# ── Entry point ──────────────────────────────────────────────────────────────


def build_export(
    export_type: AnnotationExportType, annotations: list[ExportedAnnotation], name: str, version: str
) -> FileExport:
    if export_type == AnnotationExportType.PIXIMI:
        return FileExport(file_name=f"{name}.json", mime="application/json", data=piximi_json(annotations, name))
    if export_type == AnnotationExportType.COCO:
        return FileExport(file_name=f"{name}.json", mime="application/json", data=coco_json(annotations, version))
    return FileExport(file_name=f"{name}.zip", mime="application/zip", data=masks_zip(annotations, export_type, name))
