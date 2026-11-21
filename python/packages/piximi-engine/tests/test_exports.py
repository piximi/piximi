"""Annotation exports: the records, and each format's layout."""

from __future__ import annotations

import io
import json
import zipfile

import numpy as np
import pytest
import tifffile
from piximi_engine import ReferenceEngine
from piximi_engine.api import Project
from piximi_engine.exports import build_export, layout_masks
from piximi_link.peer import HandlerContext
from piximi_schema.exports import AnnotationExportType, AnnotationsExportRequest, ExportedAnnotation
from piximi_schema.entities import Partition, Shape
from piximi_schema.query import AnnotationQuery


def record(**overrides) -> ExportedAnnotation:
    base = dict(
        id="ann-1",
        image_id="img-1",
        image_name="first",
        image_shape=Shape(planes=1, height=4, width=5, channels=1),
        plane_id="plane-1",
        plane_index=0,
        volume_id="vol-1",
        kind_id="kind-1",
        kind_name="Cell",
        category_id="cat-1",
        category_name="Alive",
        partition=Partition.UNASSIGNED,
        timepoint=0,
        # rows [1 1 0] [0 1 1] at (0, 0)
        bounding_box=(0, 0, 3, 2),
        encoded_mask=[0, 2, 2, 2],
    )
    base.update(overrides)
    return ExportedAnnotation(**base)


def read_pages(data: bytes) -> np.ndarray:
    with tifffile.TiffFile(io.BytesIO(data)) as tif:
        return np.stack([page.asarray() for page in tif.pages])


def test_piximi_json_holds_the_records():
    file = build_export(AnnotationExportType.PIXIMI, [record()], "proj", "0.1")
    assert file.file_name == "proj.json" and file.mime == "application/json"
    payload = json.loads(file.data)
    assert payload["format"] == "piximi-annotations" and payload["version"] == 1 and payload["project"] == "proj"
    [ann] = payload["annotations"]
    assert ann["encodedMask"] == [0, 2, 2, 2] and ann["boundingBox"] == [0, 0, 3, 2] and ann["categoryName"] == "Alive"


def test_coco_has_a_polygon_in_image_coordinates():
    file = build_export(AnnotationExportType.COCO, [record(bounding_box=(2, 1, 5, 3))], "proj", "0.1")
    coco = json.loads(file.data)
    assert [img["file_name"] for img in coco["images"]] == ["first"]
    assert coco["categories"] == [{"id": 0, "name": "Alive", "supercategory": "Cell"}]
    [ann] = coco["annotations"]
    assert ann["bbox"] == [2, 1, 3, 2] and ann["area"] == 4 and ann["iscrowd"] == 0
    polygon = ann["segmentation"][0]
    xs, ys = polygon[0::2], polygon[1::2]
    assert len(xs) >= 3
    assert min(xs) >= 1.5 and max(xs) <= 5.5 and min(ys) >= 0.5 and max(ys) <= 3.5


def test_mask_layouts_per_format():
    second = record(id="ann-2", volume_id="vol-2", category_id="cat-2", category_name="Dead", bounding_box=(3, 2, 5, 4), encoded_mask=[0, 4])
    records = [record(), second]
    matrix = layout_masks(records, AnnotationExportType.MATRIX)
    assert list(matrix) == ["first/Cell.tiff"]
    labels = matrix["first/Cell.tiff"]
    assert labels.shape == (1, 4, 5) and labels.dtype == np.uint16
    assert labels[0].tolist() == [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 0, 2, 2], [0, 0, 0, 2, 2]]

    semantic = layout_masks(records, AnnotationExportType.LABELED_SEMANTIC_MASKS)
    assert semantic["first/Cell.tiff"][0].tolist() == [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 0, 2, 2], [0, 0, 0, 2, 2]]

    binary_semantic = layout_masks(records, AnnotationExportType.BINARY_SEMANTIC_MASKS)
    assert sorted(binary_semantic) == ["first/Cell_Alive.tiff", "first/Cell_Dead.tiff"]
    assert int(binary_semantic["first/Cell_Alive.tiff"][0, 0, 0]) == 65535

    instances = layout_masks(records + [record(id="ann-3", volume_id="vol-3")], AnnotationExportType.BINARY_INSTANCES)
    assert sorted(instances) == ["first/Cell/Alive_0.tiff", "first/Cell/Alive_1.tiff", "first/Cell/Dead_0.tiff"]

    labeled = layout_masks(records, AnnotationExportType.LABELED_INSTANCES)
    assert sorted(labeled) == ["first/Cell.tiff", "first/Cell_Alive.tiff", "first/Cell_Dead.tiff"]
    rgb = labeled["first/Cell.tiff"]
    assert rgb.shape == (3, 4, 5) and rgb.dtype == np.uint8
    # Object 1 → (1, 0, 0), object 2 → (2, 0, 0).
    assert (int(rgb[0, 0, 0]), int(rgb[1, 0, 0]), int(rgb[2, 0, 0])) == (1, 0, 0)
    assert (int(rgb[0, 3, 4]), int(rgb[1, 3, 4]), int(rgb[2, 3, 4])) == (2, 0, 0)


def test_planes_become_pages_and_objects_clip_to_the_image():
    deep = record(image_shape=Shape(planes=3, height=4, width=5, channels=1), plane_index=2, bounding_box=(4, 3, 7, 5), encoded_mask=[0, 6])
    [image] = layout_masks([deep], AnnotationExportType.MATRIX).values()
    assert image.shape == (3, 4, 5)
    assert int(image[2, 3, 4]) == 1 and int(image[0].sum()) == 0 and int(image[2].sum()) == 1


def test_zip_holds_readable_tiffs():
    file = build_export(AnnotationExportType.LABELED_INSTANCES, [record()], "my/proj", "0.1")
    assert file.file_name == "my/proj.zip" and file.mime == "application/zip"
    with zipfile.ZipFile(io.BytesIO(file.data)) as archive:
        names = sorted(archive.namelist())
        assert names == ["my_proj/first/Cell.tiff", "my_proj/first/Cell_Alive.tiff"]
        pages = read_pages(archive.read("my_proj/first/Cell.tiff"))
    assert pages.shape == (3, 4, 5) and int(pages[0, 0, 0]) == 1


async def test_engine_exports_its_objects(engine: ReferenceEngine):
    assert "export.annotations" in engine.capabilities()
    project = Project(engine)
    image = project.images[0]
    mask = np.zeros((image.shape.height, image.shape.width), dtype=bool)
    mask[1:3, 1:4] = True
    annotation_id = (await project.add_annotation(image.id, mask)).id
    file = await engine.export_annotations(
        AnnotationsExportRequest(type=AnnotationExportType.PIXIMI, query=AnnotationQuery(ids=[annotation_id])),
        HandlerContext(None),
    )
    assert file.file_name == f"{engine.experiment.name}.json"
    [ann] = json.loads(file.data)["annotations"]
    assert ann["id"] == annotation_id and ann["kindName"] == "Unknown" and ann["imageName"] == image.name
    assert ann["boundingBox"] == [1, 1, 4, 3]
    zipped = await engine.export_annotations(
        AnnotationsExportRequest(type=AnnotationExportType.MATRIX, name="out"), HandlerContext(None)
    )
    with zipfile.ZipFile(io.BytesIO(zipped.data)) as archive:
        assert f"out/{image.name}/Unknown.tiff" in archive.namelist()
        pages = read_pages(archive.read(f"out/{image.name}/Unknown.tiff"))
    assert int(pages[0, 1, 1]) == 1 and int(pages[0, 0, 0]) == 0


def test_unknown_format_is_refused():
    with pytest.raises(ValueError):
        layout_masks([record()], AnnotationExportType.COCO)
