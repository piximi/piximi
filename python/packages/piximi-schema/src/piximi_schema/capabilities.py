from enum import StrEnum


class Capability(StrEnum):
    """What a backend declares it can do; the frontend hides the rest."""

    RAW_LOCAL = "raw-local"
    SEGMENTATION = "segmentation"
    CLASSIFICATION = "classification"
    CLASSIFICATION_TRAIN = "classification.train"
    # A tfjs model fetched by URL lives in the browser's own worker, so only
    # the in-browser backend declares this.
    CLASSIFICATION_IMPORT_URL = "classification.import-url"
    MEASUREMENTS = "measurements"
    INGEST_UPLOAD = "ingest.upload"
    INGEST_PATHS = "ingest.paths"
    PROJECT_IO = "project.io"
    ANNOTATIONS_COMMIT = "annotations.commit"
    EVENTS_PUSH = "events.push"
