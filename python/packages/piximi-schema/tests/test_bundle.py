import json

import pytest
from pydantic import TypeAdapter, ValidationError

from piximi_schema import PROTOCOL_VERSION
from piximi_schema.entities import AnnotationObject, Category, ImageObject
from piximi_schema.events import BackendEvent
from piximi_schema.export import BUNDLE_PATH, build_bundle
from piximi_schema.methods import METHODS, NOTIFICATIONS
from piximi_schema.render import RenderedImage
from piximi_schema.segmentation import ModelDescriptor


@pytest.fixture(scope="module")
def bundle():
    return build_bundle()


def test_bundle_names_every_method_payload(bundle):
    defs = bundle["$defs"]
    for name, spec in bundle["methods"].items():
        for key in ("params", "result", "progress"):
            ref = spec[key]
            if ref is not None:
                assert ref.split("/")[-1] in defs, f"{name}.{key} -> {ref}"
    assert set(bundle["methods"]) == {m.name for m in METHODS}
    assert set(bundle["notifications"]) == {n.name for n in NOTIFICATIONS}
    assert bundle["protocolVersion"] == PROTOCOL_VERSION


def test_optional_fields_are_absent_not_null(bundle):
    image = bundle["$defs"]["ImageObject"]
    assert "predictionConfidence" not in image["required"]
    prop = image["properties"]["predictionConfidence"]
    # Not `anyOf [number, null]`: an unset optional is omitted on the wire.
    assert prop["type"] == "number"
    assert "anyOf" not in prop and "default" not in prop


def test_binary_fields_are_typed_for_typescript(bundle):
    assert bundle["$defs"]["RenderedImage"]["properties"]["data"]["tsType"] == "Uint8Array"


def test_checked_in_bundle_matches_models(bundle):
    # The frontend generates its types from the file, so it must not drift.
    assert json.loads(BUNDLE_PATH.read_text()) == bundle


def test_wire_form_is_camel_case_and_round_trips():
    wire = {
        "id": "img-1",
        "name": "first",
        "seriesId": "s-1",
        "shape": {"planes": 1, "height": 4, "width": 3, "channels": 2},
        "categoryId": "cat-1",
        "activePlaneId": "p-1",
        "timepoint": 0,
        "bitDepth": 8,
        "partition": "Unassigned",
    }
    image = ImageObject.model_validate(wire)
    assert image.series_id == "s-1"
    assert image.to_wire() == wire


def test_undeclared_fields_are_rejected():
    with pytest.raises(ValidationError):
        ImageObject.model_validate({"id": "x", "bogus": 1})


def test_discriminated_unions_parse_by_tag():
    category = TypeAdapter(Category).validate_python(
        {"type": "annotation", "id": "c", "color": "#fff", "name": "n", "isUnknown": False, "kindId": "k"}
    )
    assert category.kind_id == "k"

    event = TypeAdapter(BackendEvent).validate_python(
        {
            "type": "jobs/didUpdate",
            "job": {
                "id": "j",
                "kind": "segmentation",
                "status": "running",
                "progress": -1,
                "message": "Starting",
                "cancellable": True,
                "startedAt": 0,
            },
        }
    )
    assert event.job.status == "running"


def test_descriptor_with_option_schema():
    descriptor = ModelDescriptor.model_validate(
        {
            "name": "fake",
            "displayName": "Fake",
            "modelLoaded": False,
            "status": "ready",
            "framework": "fake",
            "tasks": ["segmentation"],
            "outputPolicy": {"mode": "single", "defaultKindName": "Object"},
            "channelPolicy": {"mode": "passthrough", "maxChannels": 1},
            "cancellableLoad": True,
            "description": "",
            "use": "",
            "sources": [],
            "optionSchema": {
                "groups": [
                    {
                        "id": "g",
                        "label": "G",
                        "fields": [
                            {"key": "diameter", "label": "Diameter", "type": "number", "optional": True},
                            {"key": "chan", "label": "Channel", "type": "channelIndex", "default": 1, "zeroLabel": "Mean"},
                        ],
                    }
                ]
            },
        }
    )
    fields = descriptor.option_schema.groups[0].fields
    assert fields[0].type == "number" and fields[1].zero_label == "Mean"
    assert "cite" not in descriptor.to_wire()


def test_annotation_mask_is_a_list_of_runs():
    annotation = AnnotationObject.model_validate(
        {
            "id": "a",
            "planeId": "p",
            "imageId": "i",
            "volumeId": "v",
            "partition": "Unassigned",
            "shape": {"planes": 1, "height": 2, "width": 2, "channels": 1},
            "boundingBox": [0, 0, 2, 2],
            "encodedMask": [0, 4],
        }
    )
    assert annotation.encoded_mask == [0, 4]


def test_rendered_image_carries_bytes():
    image = RenderedImage(width=1, height=1, mime="image/png", data=b"\x89PNG")
    assert image.data == b"\x89PNG"
