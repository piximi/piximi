"""The ``.piximi`` project file: a zip holding a zarr v3 tree laid out as
the browser's ``core/file-io/project-saver/version-writers/writeV2.ts``
writes it (and ``readV2.ts`` reads it), so a project moves between an
engine and the browser-only app in either direction.

The zarr side is kept deliberately small, byte for byte what zarrita
produces: every node is a ``zarr.json``, every array is one chunk of raw
little-endian bytes (``codecs: []``) spelled ``c.0.0``, and attributes
carry the entities as parallel arrays with ``null`` for absent optionals
and non-finite numbers. The archive has the tree under ``<name>.zarr/``
(with an explicit folder entry, which is how the browser finds the root)
and model weights under ``models/<name>/`` beside it.
"""

from __future__ import annotations

import io
import json
import math
import re
import zipfile
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import numpy as np
from piximi_schema.classification import Classifier
from piximi_schema.entities import (
    AnnotationObject,
    AnnotationVolume,
    Category,
    Channel,
    ChannelMeta,
    Experiment,
    ImageObject,
    ImageSeries,
    Kind,
    Plane,
    PredictionCorrection,
    Shape,
)
from pydantic import TypeAdapter

FORMAT_VERSION = "2.0.0"
"""What the browser's ``detectVersion`` routes to its v2 reader (``< 3.0.0``)."""

MODELS_DIR = "models"
MODEL_MANIFEST = "piximi_manifest.json"
MANIFEST_VERSION = 2

_DTYPES = {
    "uint8": np.uint8,
    "uint16": np.uint16,
    "uint32": np.uint32,
    "int8": np.int8,
    "int16": np.int16,
    "int32": np.int32,
    "float32": np.float32,
    "float64": np.float64,
}
_NAMES = {np.dtype(value): key for key, value in _DTYPES.items()}
_CATEGORY = TypeAdapter(Category)


def _json_safe(value: Any) -> Any:
    """``null`` for non-finite numbers, as the browser writes them."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


def _sanitize(name: str) -> str:
    return re.sub(r"[./\\]", "_", name) or "project"


# ── zarr v3 in a zip ─────────────────────────────────────────────────────────


class ZarrZipWriter:
    def __init__(self, archive: zipfile.ZipFile, root: str) -> None:
        self.archive = archive
        self.root = root
        # The folder entry the browser's loader keys on (`zip.folder(/\.zarr\/$/)`).
        archive.writestr(zipfile.ZipInfo(f"{root}/"), b"")

    def _key(self, path: str, name: str) -> str:
        return f"{self.root}/{path}/{name}" if path else f"{self.root}/{name}"

    def group(self, path: str, attrs: dict[str, Any] | None = None) -> None:
        metadata = {"zarr_format": 3, "node_type": "group", "attributes": _json_safe(attrs or {})}
        self.archive.writestr(self._key(path, "zarr.json"), json.dumps(metadata))

    def array(self, path: str, data: np.ndarray) -> None:
        data = np.ascontiguousarray(data)
        if data.size == 0:
            raise ValueError(f"Cannot write {path}: empty array")
        name = _NAMES[data.dtype]
        metadata = {
            "zarr_format": 3,
            "node_type": "array",
            "shape": list(data.shape),
            "data_type": name,
            "chunk_grid": {"name": "regular", "configuration": {"chunk_shape": list(data.shape)}},
            "chunk_key_encoding": {"name": "default", "configuration": {"separator": "."}},
            "codecs": [],
            "fill_value": 0,
            "attributes": {},
        }
        self.archive.writestr(self._key(path, "zarr.json"), json.dumps(metadata))
        chunk = "c." + ".".join("0" for _ in data.shape)
        self.archive.writestr(self._key(path, chunk), data.astype(data.dtype.newbyteorder("<")).tobytes())


class ZarrZipReader:
    def __init__(self, archive: zipfile.ZipFile) -> None:
        self.archive = archive
        self.names = set(archive.namelist())
        roots = {name[:-1] for name in self.names if name.endswith(".zarr/")}
        if not roots:
            # No folder entries (an archive made without them): take the prefix.
            roots = {
                name.split("/", 1)[0]
                for name in self.names
                if "/" in name and name.split("/", 1)[0].endswith(".zarr")
            }
        if len(roots) != 1:
            raise ValueError("Could not determine the zarr root in the project file")
        self.root = roots.pop()

    def _key(self, path: str, name: str) -> str:
        return f"{self.root}/{path}/{name}" if path else f"{self.root}/{name}"

    def has(self, path: str) -> bool:
        return self._key(path, "zarr.json") in self.names

    def _metadata(self, path: str) -> dict[str, Any]:
        key = self._key(path, "zarr.json")
        if key not in self.names:
            raise KeyError(f"No zarr node at {path or '/'}")
        return json.loads(self.archive.read(key))

    def attrs(self, path: str) -> dict[str, Any]:
        return self._metadata(path).get("attributes", {})

    def array(self, path: str) -> np.ndarray:
        metadata = self._metadata(path)
        if metadata.get("node_type") != "array":
            raise ValueError(f"{path} is not an array")
        if any(codec.get("name") not in (None, "bytes") for codec in metadata.get("codecs", [])):
            raise ValueError(f"{path}: only raw arrays are supported")
        shape = metadata["shape"]
        dtype = np.dtype(_DTYPES[metadata["data_type"]]).newbyteorder("<")
        chunk_shape = metadata["chunk_grid"]["configuration"]["chunk_shape"]
        separator = metadata.get("chunk_key_encoding", {}).get("configuration", {}).get("separator", "/")
        out = np.zeros(shape, dtype=dtype)
        counts = [math.ceil(s / c) for s, c in zip(shape, chunk_shape)]
        for index in np.ndindex(*counts):
            key = self._key(path, "c" + separator + separator.join(str(i) for i in index))
            if key not in self.names:
                continue
            chunk = np.frombuffer(self.archive.read(key), dtype=dtype).reshape(chunk_shape)
            slices = tuple(slice(i * c, min((i + 1) * c, s)) for i, c, s in zip(index, chunk_shape, shape))
            out[slices] = chunk[tuple(slice(0, sl.stop - sl.start) for sl in slices)]
        return out


# ── The v2 layout ────────────────────────────────────────────────────────────

G = {
    "data": "data",
    "classifier": "classifier",
    "segmenter": "segmenter",
    "series": "image_series",
    "images": "images",
    "planes": "planes",
    "kinds": "kinds",
    "categories": "categories",
    "metas": "channel_metas",
    "channels": "channels",
    "volumes": "annotation_volumes",
    "annotations": "annotations",
    "model_info": "model_info",
    "preprocess": "preprocessing_settings",
    "normalize": "normalize_options",
    "crop": "crop_options",
    "optimizer": "optimizer_settings",
    "runs": "runs",
    "hyperparameters": "hyperparameters",
    "eval": "eval_results",
}

SHAPE = ("shape_planes", "shape_height", "shape_width", "shape_channels")
CORRECTION = (
    "prediction_corrected_from_run_id",
    "prediction_corrected_category_id",
    "prediction_corrected_confidence",
    "prediction_corrected_at",
)
HISTORY_COLUMNS = ("epoch", "loss", "valLoss", "accuracy", "valAccuracy")


def _shape_columns(shapes: list[Shape]) -> dict[str, list]:
    return {
        SHAPE[0]: [s.planes for s in shapes],
        SHAPE[1]: [s.height for s in shapes],
        SHAPE[2]: [s.width for s in shapes],
        SHAPE[3]: [s.channels for s in shapes],
    }


def _correction_columns(items: list[Any]) -> dict[str, list]:
    corrections = [getattr(item, "prediction_corrected", None) for item in items]
    return {
        CORRECTION[0]: [c.corrected_from_run_id if c else None for c in corrections],
        CORRECTION[1]: [c.predicted_category_id if c else None for c in corrections],
        CORRECTION[2]: [c.prediction_confidence if c else None for c in corrections],
        CORRECTION[3]: [c.corrected_at if c else None for c in corrections],
    }


def _shape_at(attrs: dict, i: int) -> Shape:
    return Shape(planes=attrs[SHAPE[0]][i], height=attrs[SHAPE[1]][i], width=attrs[SHAPE[2]][i], channels=attrs[SHAPE[3]][i])


def _correction_at(attrs: dict, i: int) -> PredictionCorrection | None:
    if CORRECTION[0] not in attrs or attrs[CORRECTION[0]][i] is None:
        return None
    return PredictionCorrection(
        corrected_from_run_id=attrs[CORRECTION[0]][i],
        predicted_category_id=attrs[CORRECTION[1]][i],
        prediction_confidence=attrs[CORRECTION[2]][i],
        corrected_at=attrs[CORRECTION[3]][i],
    )


def _class_map_entries(class_map: dict | None) -> list | None:
    return [[int(index), name] for index, name in class_map.items()] if class_map else None


def _class_map(entries: list | None) -> dict[str, str] | None:
    return {str(index): name for index, name in entries} if entries else None


@dataclass
class ProjectContents:
    """A project as the file holds it, with the pixels read on demand."""

    experiment: Experiment
    series: list[ImageSeries]
    images: list[ImageObject]
    planes: list[Plane]
    kinds: list[Kind]
    categories: list[Category]
    channel_metas: list[ChannelMeta]
    channels: list[Channel]
    volumes: list[AnnotationVolume]
    annotations: list[AnnotationObject]
    classifiers: list[Classifier] = field(default_factory=list)
    """Records; their weights (if any) by classifier id in ``weights``."""
    weights: dict[str, bytes] = field(default_factory=dict)
    _pixels: Any = None

    def pixels(self, channel_id: str) -> np.ndarray:
        return self._pixels(channel_id)


# ── Writing ──────────────────────────────────────────────────────────────────


def write_project(
    contents: ProjectContents,
    name: str,
    *,
    app_version: str,
    kind_names: dict[str, str],
    on_progress: Any = None,
) -> bytes:
    """The project as a ``.piximi`` archive. ``kind_names`` names the
    classifier targets (``image`` for the image classifier)."""
    buffer = io.BytesIO()
    root = _sanitize(name) + ".zarr"
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
        z = ZarrZipWriter(archive, root)
        z.group("", {"version": FORMAT_VERSION, "app_version": app_version})
        exp = contents.experiment
        z.group(G["data"], {"experiment_id": exp.id, "experiment_name": exp.name, "experiment_channels": exp.channels})
        _write_series(z, contents.series)
        _write_images(z, contents.images)
        z.group(
            f"{G['data']}/{G['planes']}",
            {
                "plane_id": [p.id for p in contents.planes],
                "image_id": [p.image_id for p in contents.planes],
                "z_index": [p.z_index for p in contents.planes],
            },
        )
        z.group(
            f"{G['data']}/{G['kinds']}",
            {
                "kind_id": [k.id for k in contents.kinds],
                "name": [k.name for k in contents.kinds],
                "unknown_category_id": [k.unknown_category_id for k in contents.kinds],
            },
        )
        z.group(
            f"{G['data']}/{G['categories']}",
            {
                "category_id": [c.id for c in contents.categories],
                "name": [c.name for c in contents.categories],
                "color": [c.color for c in contents.categories],
                "is_unknown_B": [int(c.is_unknown) for c in contents.categories],
                "type": [c.type for c in contents.categories],
                "kind_id": [getattr(c, "kind_id", None) if c.type == "annotation" else None for c in contents.categories],
            },
        )
        _write_metas(z, contents.channel_metas)
        _write_channels(z, contents, on_progress)
        _write_volumes(z, contents.volumes)
        _write_annotations(z, contents.annotations)
        _write_classifiers(z, contents.classifiers, kind_names)
        z.group(
            G["segmenter"],
            {"loaded_model": None, "models": [], "channel_selection": [], "kind_names": [], "option_values": []},
        )
        for classifier in contents.classifiers:
            blob = contents.weights.get(classifier.id)
            if blob is None:
                continue
            folder = f"{MODELS_DIR}/{_sanitize(classifier.name)}"
            manifest = {
                "formatVersion": MANIFEST_VERSION,
                "savedAt": datetime.now(UTC).isoformat(),
                "modelName": classifier.name,
                "classifierId": classifier.id,
                "framework": classifier.framework,
                "files": {"weights": "model.bin"},
            }
            archive.writestr(f"{folder}/{MODEL_MANIFEST}", json.dumps(manifest))
            archive.writestr(f"{folder}/model.bin", blob)
    return buffer.getvalue()


def _write_series(z: ZarrZipWriter, series: list[ImageSeries]) -> None:
    z.group(
        f"{G['data']}/{G['series']}",
        {
            "series_id": [s.id for s in series],
            "experiment_id": [s.experiment_id for s in series],
            "name": [s.name for s in series],
            "bit_depth": [s.bit_depth for s in series],
            "time_series_B": [int(s.time_series) for s in series],
            "active_image_id": [s.active_image_id for s in series],
            **_shape_columns([s.shape for s in series]),
        },
    )


def _write_images(z: ZarrZipWriter, images: list[ImageObject]) -> None:
    z.group(
        f"{G['data']}/{G['images']}",
        {
            "image_id": [i.id for i in images],
            "name": [i.name for i in images],
            "series_id": [i.series_id for i in images],
            "category_id": [i.category_id for i in images],
            "active_plane_id": [i.active_plane_id for i in images],
            "timepoint": [i.timepoint for i in images],
            "bit_depth": [i.bit_depth for i in images],
            "partition": [i.partition for i in images],
            "prediction_confidence": [i.prediction_confidence for i in images],
            "predicted_at_run_id": [i.predicted_at_run_id for i in images],
            **_shape_columns([i.shape for i in images]),
            **_correction_columns(images),
        },
    )


def _write_metas(z: ZarrZipWriter, metas: list[ChannelMeta]) -> None:
    z.group(
        f"{G['data']}/{G['metas']}",
        {
            "channel_meta_id": [m.id for m in metas],
            "name": [m.name for m in metas],
            "bit_depth": [m.bit_depth for m in metas],
            "color_map": [list(m.color_map) for m in metas],
            "visible_B": [int(m.visible) for m in metas],
            "min_value": [m.min_value for m in metas],
            "max_value": [m.max_value for m in metas],
            "ramp_min": [m.ramp_min for m in metas],
            "ramp_max": [m.ramp_max for m in metas],
            "ramp_min_limit": [m.ramp_min_limit for m in metas],
            "ramp_max_limit": [m.ramp_max_limit for m in metas],
        },
    )


def _write_channels(z: ZarrZipWriter, contents: ProjectContents, on_progress: Any) -> None:
    channels = contents.channels
    path = f"{G['data']}/{G['channels']}"
    z.group(
        path,
        {
            "channel_id": [c.id for c in channels],
            "plane_id": [c.plane_id for c in channels],
            "channel_meta_id": [c.channel_meta_id for c in channels],
            "name": [c.name for c in channels],
            "dtype": [c.dtype for c in channels],
            "bit_depth": [c.bit_depth for c in channels],
            "width": [c.width for c in channels],
            "height": [c.height for c in channels],
            "min_value": [c.min_value for c in channels],
            "max_value": [c.max_value for c in channels],
            "total": [c.total for c in channels],
            "mean": [c.mean for c in channels],
            "median": [c.median for c in channels],
            "std": [c.std for c in channels],
            "mad": [c.mad for c in channels],
            "lower_quartile": [c.lower_quartile for c in channels],
            "upper_quartile": [c.upper_quartile for c in channels],
            "features": [c.features for c in channels],
        },
    )
    for index, channel in enumerate(channels):
        pixels = contents.pixels(channel.id)
        pixels = pixels.astype(np.uint8 if channel.bit_depth == 8 else np.uint16, copy=False)
        z.group(f"{path}/{channel.id}")
        z.array(f"{path}/{channel.id}/data", pixels)
        histogram = np.bincount(pixels.ravel(), minlength=2**channel.bit_depth).astype(np.uint32)
        z.array(f"{path}/{channel.id}/histogram", histogram)
        if on_progress is not None:
            on_progress((index + 1) / len(channels))


def _write_volumes(z: ZarrZipWriter, volumes: list[AnnotationVolume]) -> None:
    z.group(
        f"{G['data']}/{G['volumes']}",
        {
            "volume_id": [v.id for v in volumes],
            "image_id": [v.image_id for v in volumes],
            "kind_id": [v.kind_id for v in volumes],
            "category_id": [v.category_id for v in volumes],
            "timepoint": [v.timepoint for v in volumes],
            "prediction_confidence": [v.prediction_confidence for v in volumes],
            "predicted_at_run_id": [v.predicted_at_run_id for v in volumes],
            **_correction_columns(volumes),
        },
    )


def _write_annotations(z: ZarrZipWriter, annotations: list[AnnotationObject]) -> None:
    offsets = [0]
    runs: list[int] = []
    for annotation in annotations:
        runs.extend(annotation.encoded_mask)
        offsets.append(len(runs))
    path = f"{G['data']}/{G['annotations']}"
    z.group(
        path,
        {
            "annotation_id": [a.id for a in annotations],
            "plane_id": [a.plane_id for a in annotations],
            "image_id": [a.image_id for a in annotations],
            "volume_id": [a.volume_id for a in annotations],
            "partition": [a.partition for a in annotations],
            "bbox": [list(a.bounding_box) for a in annotations],
            "mask_offsets": offsets,
            **_shape_columns([a.shape for a in annotations]),
        },
    )
    if runs:
        z.array(f"{path}/masks", np.asarray(runs, dtype=np.uint32))


def _write_settings(z: ZarrZipWriter, path: str, hyperparameters: dict[str, Any]) -> None:
    pre = hyperparameters["preprocess"]
    shape = pre["inputShape"]
    z.group(
        f"{path}/{G['preprocess']}",
        {
            "shuffle_B": int(pre["shuffle"]),
            "training_percent": pre["trainingPercentage"],
            "input_shape": [shape["planes"], shape["height"], shape["width"], shape["channels"]],
        },
    )
    z.group(
        f"{path}/{G['preprocess']}/{G['normalize']}",
        {"normalize_B": int(pre["normalizeOptions"]["normalize"]), "center_B": int(pre["normalizeOptions"]["center"])},
    )
    z.group(
        f"{path}/{G['preprocess']}/{G['crop']}",
        {"num_crops": pre["cropOptions"]["numCrops"], "crop_schema": pre["cropOptions"]["cropSchema"]},
    )
    opt = hyperparameters["optimizer"]
    z.group(
        f"{path}/{G['optimizer']}",
        {
            "learning_rate": opt["learningRate"],
            "loss_function": opt["lossFunction"],
            "metrics": opt["metrics"],
            "optimization_algorithm": opt["optimizationAlgorithm"],
            "epochs": opt["epochs"],
            "batch_size": opt["batchSize"],
        },
    )


DEFAULT_ARCHITECTURE = "simple-cnn"
"""The browser's default pick for a new classifier; it falls back to the
backend's first architecture when it does not know this one."""


def _write_classifiers(z: ZarrZipWriter, classifiers: list[Classifier], kind_names: dict[str, str]) -> None:
    # The browser keeps a classifier entry for the image target and every
    # kind, and its selectors throw on a kind without one, so every target
    # gets a group here, with or without models. ``kind_names`` lists them.
    by_target: dict[str, list[Classifier]] = {target: [] for target in kind_names}
    for classifier in classifiers:
        by_target.setdefault(classifier.target_id, []).append(classifier)
    z.group(G["classifier"], {"classifier_kinds": list(by_target)})
    for target_id, group in by_target.items():
        path = f"{G['classifier']}/{target_id}"
        z.group(
            path,
            {
                "models": [c.id for c in group],
                "model_target_id": target_id,
                "model_target_name": kind_names.get(target_id, target_id),
                "active_model": None,
                "new_model_arch": group[0].architecture_id if group else DEFAULT_ARCHITECTURE,
                "status": "idle",
            },
        )
        for classifier in group:
            wire = classifier.to_wire()
            model_path = f"{path}/{classifier.id}"
            z.group(model_path, {"name": classifier.name})
            info_path = f"{model_path}/{G['model_info']}"
            z.group(
                info_path,
                {
                    "class_map": _class_map_entries(wire.get("classMap")),
                    "confidence_threshold": wire["confidenceThreshold"],
                    "valid_B": int(wire["valid"]),
                    "init_seed": wire.get("initSeed"),
                    "trained_B": int(wire["trained"]),
                    "architecture_id": wire["architectureId"],
                    "framework": wire["framework"],
                    "classes": wire["classes"],
                    "trainable_B": int(wire["trainable"]),
                },
            )
            _write_settings(z, info_path, wire["hyperparameters"])
            runs = wire.get("runs", [])
            runs_path = f"{info_path}/{G['runs']}"
            z.group(runs_path, {"run_ids": [run["id"] for run in runs]})
            for run in runs:
                run_path = f"{runs_path}/{run['id']}"
                z.group(
                    run_path,
                    {
                        "id": run["id"],
                        "parent_run_id": run.get("parentRunId"),
                        "started_at": run["startedAt"],
                        "finished_at": run.get("finishedAt"),
                        "status": run["status"],
                        "trigger": run["trigger"],
                        "seed": run.get("seed"),
                        "app_version": run["appVersion"],
                        "tfjs_version": run["frameworkVersion"],
                        "backend": run["device"],
                        "class_map": _class_map_entries(run.get("classMap")),
                        "training_fingerprint": run["trainingFingerprint"],
                        "validation_fingerprint": run["validationFingerprint"],
                        "val_ids": run["valIds"],
                        "category_set_hash": run["categorySetHash"],
                        "weights_ref": run.get("weightsRef"),
                    },
                )
                hyper_path = f"{run_path}/{G['hyperparameters']}"
                z.group(hyper_path, {"architecture": run["hyperparameters"]["architecture"]})
                _write_settings(z, hyper_path, run["hyperparameters"])
                history = run.get("history", [])
                if history:
                    z.array(
                        f"{run_path}/history",
                        np.asarray([[epoch[column] for column in HISTORY_COLUMNS] for epoch in history], dtype=np.float64),
                    )
                evaluation = run.get("evalResults")
                if evaluation:
                    eval_path = f"{run_path}/{G['eval']}"
                    z.group(
                        eval_path,
                        {
                            "accuracy": evaluation["accuracy"],
                            "cross_entropy": evaluation["crossEntropy"],
                            "precision": evaluation["precision"],
                            "recall": evaluation["recall"],
                            "f1_score": evaluation["f1Score"],
                        },
                    )
                    matrix = evaluation.get("confusionMatrix") or []
                    if matrix and matrix[0]:
                        z.array(f"{eval_path}/confusion_matrix", np.asarray(matrix, dtype=np.int32))


# ── Reading ──────────────────────────────────────────────────────────────────


def read_project(data: bytes) -> ProjectContents:
    """A ``.piximi`` archive's contents; pixels are read when asked for."""
    archive = zipfile.ZipFile(io.BytesIO(data))
    if any(name.endswith("/.zgroup") or name.endswith("/.zarray") for name in archive.namelist()):
        raise ValueError(
            "This project file is in an older layout (zarr v2) the engine does not read. "
            "Open it in the browser app and save it again to upgrade it."
        )
    z = ZarrZipReader(archive)
    version = str(z.attrs("").get("version", ""))
    if version.split(".")[0] != "2":
        raise ValueError(
            f"This project file is format {version or 'unknown'}; the engine reads format 2 only. "
            "Open it in the browser app and save it again to upgrade it."
        )
    d = G["data"]
    data_attrs = z.attrs(d)
    experiment = Experiment(
        id=data_attrs["experiment_id"], name=data_attrs["experiment_name"], channels=data_attrs.get("experiment_channels")
    )

    a = z.attrs(f"{d}/{G['series']}")
    series = [
        ImageSeries(
            id=a["series_id"][i],
            experiment_id=a["experiment_id"][i],
            name=a["name"][i],
            bit_depth=a["bit_depth"][i],
            time_series=bool(a["time_series_B"][i]),
            active_image_id=a["active_image_id"][i],
            shape=_shape_at(a, i),
        )
        for i in range(len(a["series_id"]))
    ]
    a = z.attrs(f"{d}/{G['images']}")
    images = [
        ImageObject(
            id=a["image_id"][i],
            name=a["name"][i],
            series_id=a["series_id"][i],
            shape=_shape_at(a, i),
            category_id=a["category_id"][i],
            active_plane_id=a["active_plane_id"][i],
            timepoint=a["timepoint"][i],
            bit_depth=a["bit_depth"][i],
            partition=a["partition"][i],
            prediction_confidence=a["prediction_confidence"][i],
            predicted_at_run_id=a["predicted_at_run_id"][i],
            prediction_corrected=_correction_at(a, i),
        )
        for i in range(len(a["image_id"]))
    ]
    a = z.attrs(f"{d}/{G['planes']}")
    planes = [Plane(id=a["plane_id"][i], image_id=a["image_id"][i], z_index=a["z_index"][i]) for i in range(len(a["plane_id"]))]
    a = z.attrs(f"{d}/{G['kinds']}")
    kinds = [
        Kind(id=a["kind_id"][i], name=a["name"][i], unknown_category_id=a["unknown_category_id"][i])
        for i in range(len(a["kind_id"]))
    ]
    a = z.attrs(f"{d}/{G['categories']}")
    categories = []
    for i in range(len(a["category_id"])):
        row: dict[str, Any] = {
            "id": a["category_id"][i],
            "name": a["name"][i],
            "color": a["color"][i],
            "isUnknown": bool(a["is_unknown_B"][i]),
            "type": a["type"][i],
        }
        if a["type"][i] == "annotation":
            row["kindId"] = a["kind_id"][i]
        categories.append(_CATEGORY.validate_python(row))
    a = z.attrs(f"{d}/{G['metas']}")
    channel_metas = [
        ChannelMeta(
            id=a["channel_meta_id"][i],
            name=a["name"][i],
            bit_depth=a["bit_depth"][i],
            color_map=tuple(a["color_map"][i]),
            visible=bool(a["visible_B"][i]),
            min_value=a["min_value"][i],
            max_value=a["max_value"][i],
            ramp_min=a["ramp_min"][i],
            ramp_max=a["ramp_max"][i],
            ramp_min_limit=a["ramp_min_limit"][i],
            ramp_max_limit=a["ramp_max_limit"][i],
        )
        for i in range(len(a["channel_meta_id"]))
    ]
    a = z.attrs(f"{d}/{G['channels']}")
    channels = [
        Channel(
            id=a["channel_id"][i],
            plane_id=a["plane_id"][i],
            channel_meta_id=a["channel_meta_id"][i],
            name=a["name"][i],
            dtype=a["dtype"][i],
            bit_depth=a["bit_depth"][i],
            width=a["width"][i],
            height=a["height"][i],
            min_value=a["min_value"][i],
            max_value=a["max_value"][i],
            total=a["total"][i],
            mean=a["mean"][i],
            median=a["median"][i],
            std=a["std"][i],
            mad=a["mad"][i],
            lower_quartile=a["lower_quartile"][i],
            upper_quartile=a["upper_quartile"][i],
        )
        for i in range(len(a["channel_id"]))
    ]
    a = z.attrs(f"{d}/{G['volumes']}")
    volumes = [
        AnnotationVolume(
            id=a["volume_id"][i],
            image_id=a["image_id"][i],
            kind_id=a["kind_id"][i],
            category_id=a["category_id"][i],
            timepoint=a["timepoint"][i],
            prediction_confidence=a["prediction_confidence"][i],
            predicted_at_run_id=a["predicted_at_run_id"][i],
            prediction_corrected=_correction_at(a, i),
        )
        for i in range(len(a["volume_id"]))
    ]
    a = z.attrs(f"{d}/{G['annotations']}")
    masks = z.array(f"{d}/{G['annotations']}/masks").tolist() if z.has(f"{d}/{G['annotations']}/masks") else []
    offsets = a["mask_offsets"]
    annotations = [
        AnnotationObject(
            id=a["annotation_id"][i],
            plane_id=a["plane_id"][i],
            image_id=a["image_id"][i],
            volume_id=a["volume_id"][i],
            partition=a["partition"][i],
            bounding_box=tuple(a["bbox"][i]),
            shape=_shape_at(a, i),
            encoded_mask=[int(run) for run in masks[offsets[i] : offsets[i + 1]]],
        )
        for i in range(len(a["annotation_id"]))
    ]
    classifiers, weights = _read_classifiers(z, archive)
    channels_path = f"{d}/{G['channels']}"
    return ProjectContents(
        experiment=experiment,
        series=series,
        images=images,
        planes=planes,
        kinds=kinds,
        categories=categories,
        channel_metas=channel_metas,
        channels=channels,
        volumes=volumes,
        annotations=annotations,
        classifiers=classifiers,
        weights=weights,
        _pixels=lambda channel_id: z.array(f"{channels_path}/{channel_id}/data"),
    )


def _read_settings(z: ZarrZipReader, path: str) -> dict[str, Any]:
    pre = z.attrs(f"{path}/{G['preprocess']}")
    norm = z.attrs(f"{path}/{G['preprocess']}/{G['normalize']}")
    crop = z.attrs(f"{path}/{G['preprocess']}/{G['crop']}")
    opt = z.attrs(f"{path}/{G['optimizer']}")
    planes, height, width, channels = pre["input_shape"]
    return {
        "preprocess": {
            "shuffle": bool(pre["shuffle_B"]),
            "trainingPercentage": pre["training_percent"],
            "inputShape": {"planes": planes, "height": height, "width": width, "channels": channels},
            "normalizeOptions": {"normalize": bool(norm["normalize_B"]), "center": bool(norm["center_B"])},
            "cropOptions": {"numCrops": crop["num_crops"], "cropSchema": crop["crop_schema"]},
        },
        "optimizer": {
            "learningRate": opt["learning_rate"],
            "lossFunction": opt["loss_function"],
            "metrics": opt["metrics"],
            "optimizationAlgorithm": opt["optimization_algorithm"],
            "epochs": opt["epochs"],
            "batchSize": opt["batch_size"],
        },
    }


def _read_classifiers(z: ZarrZipReader, archive: zipfile.ZipFile) -> tuple[list[Classifier], dict[str, bytes]]:
    classifiers: list[Classifier] = []
    if not z.has(G["classifier"]):
        return classifiers, {}
    for target_id in z.attrs(G["classifier"]).get("classifier_kinds", []):
        path = f"{G['classifier']}/{target_id}"
        for classifier_id in z.attrs(path).get("models", []):
            model_path = f"{path}/{classifier_id}"
            info_path = f"{model_path}/{G['model_info']}"
            info = z.attrs(info_path)
            runs = []
            runs_path = f"{info_path}/{G['runs']}"
            for run_id in z.attrs(runs_path).get("run_ids", []) if z.has(runs_path) else []:
                run_path = f"{runs_path}/{run_id}"
                r = z.attrs(run_path)
                hyper_path = f"{run_path}/{G['hyperparameters']}"
                hyper = {"architecture": z.attrs(hyper_path)["architecture"], **_read_settings(z, hyper_path)}
                history = []
                if z.has(f"{run_path}/history"):
                    for row in z.array(f"{run_path}/history").tolist():
                        history.append(dict(zip(HISTORY_COLUMNS, row)))
                evaluation = None
                eval_path = f"{run_path}/{G['eval']}"
                if z.has(eval_path):
                    e = z.attrs(eval_path)
                    matrix = z.array(f"{eval_path}/confusion_matrix").tolist() if z.has(f"{eval_path}/confusion_matrix") else []
                    evaluation = {
                        "accuracy": e["accuracy"],
                        "crossEntropy": e["cross_entropy"],
                        "precision": e["precision"],
                        "recall": e["recall"],
                        "f1Score": e["f1_score"],
                        "confusionMatrix": matrix,
                    }
                run = {
                    "id": r["id"],
                    "parentRunId": r.get("parent_run_id"),
                    "startedAt": r["started_at"],
                    "finishedAt": r.get("finished_at"),
                    "status": r["status"],
                    "trigger": r["trigger"],
                    "seed": r.get("seed"),
                    "appVersion": r["app_version"],
                    "frameworkVersion": r["tfjs_version"],
                    "device": r["backend"],
                    "classMap": _class_map(r.get("class_map")),
                    "trainingFingerprint": r["training_fingerprint"],
                    "validationFingerprint": r["validation_fingerprint"],
                    "valIds": r["val_ids"],
                    "categorySetHash": r["category_set_hash"],
                    "weightsRef": r.get("weights_ref"),
                    "hyperparameters": hyper,
                    "history": history,
                    "evalResults": evaluation,
                }
                runs.append({key: value for key, value in run.items() if value is not None})
            record = {
                "id": classifier_id,
                "targetId": target_id,
                "name": z.attrs(model_path)["name"],
                "architectureId": info.get("architecture_id") or "",
                "framework": info.get("framework") or "",
                "hyperparameters": _read_settings(z, info_path),
                "classMap": _class_map(info.get("class_map")),
                "classes": info.get("classes") or [],
                "confidenceThreshold": info["confidence_threshold"],
                "trained": bool(info["trained_B"]),
                "trainable": bool(info.get("trainable_B", 1)),
                "valid": bool(info["valid_B"]),
                "initSeed": info.get("init_seed"),
                "runs": runs,
            }
            classifiers.append(Classifier.model_validate({key: value for key, value in record.items() if value is not None}))
    weights: dict[str, bytes] = {}
    for name in archive.namelist():
        if name.endswith("/" + MODEL_MANIFEST) and name.startswith(MODELS_DIR + "/"):
            manifest = json.loads(archive.read(name))
            blob_name = manifest.get("files", {}).get("weights")
            classifier_id = manifest.get("classifierId")
            if blob_name and classifier_id:
                weights[classifier_id] = archive.read(name[: -len(MODEL_MANIFEST)] + blob_name)
    return classifiers, weights
