from enum import StrEnum

from .base import WireModel


class ErrorCode(StrEnum):
    MODEL_NOT_FOUND = "MODEL_NOT_FOUND"
    MODEL_CREATE_FAILED = "MODEL_CREATE_FAILED"
    TF_LOAD_FAILED = "TF_LOAD_FAILED"
    LOAD_CANCELLED = "LOAD_CANCELLED"
    PREPROCESS_FAILED = "PREPROCESS_FAILED"
    TRAINING_FAILED = "TRAINING_FAILED"
    PREDICTION_FAILED = "PREDICTION_FAILED"
    EVALUATION_FAILED = "EVALUATION_FAILED"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    MISSING_FILE = "MISSING_FILE"
    INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT"
    NOT_SUPPORTED = "NOT_SUPPORTED"
    NOT_FOUND = "NOT_FOUND"
    UNKNOWN = "UNKNOWN"


class BackendErrorData(WireModel):
    """Carried in an RPC error's ``data`` when a backend operation fails;
    becomes a ``BackendError`` on the frontend."""

    code: ErrorCode
    message: str
