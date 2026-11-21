"""Classifiers: models a user builds from an architecture the backend lists
and trains on the project's labeled items, with the runs that trained them.

A classifier belongs to a target: the images of the project, or the objects
of one kind. The backend owns the records (settings, class map, runs,
predictions); a client mirrors them through ``classifiers/didChange`` and
follows training through ``classifiers/didEpoch``.
"""

from enum import StrEnum
from .base import WireModel
from .entities import Partition, PredictionCorrection, Shape

IMAGE_TARGET_ID = "11111111-0000-0000-0000-000000000000"
"""The target id of the project's image classifier; every other target is a kind id."""

# ── Hyperparameters ─────────────────────────────────────────────────────────
#
# The vocabularies carry the frontend's own values, which project files
# already persist.


class CropSchema(StrEnum):
    NONE = "None"
    """Resize the whole item to the input shape."""
    MATCH = "Match"
    """Pad up to the input shape, then crop it out (at random when training with several crops)."""


class LossFunction(StrEnum):
    ABSOLUTE_DIFFERENCE = "Absolute difference"
    CATEGORICAL_CROSS_ENTROPY = "Categorical (softmax) cross entropy"
    HINGE = "Hinge"
    HUBER = "Huber"
    LOG = "Log"
    MEAN_SQUARED_ERROR = "Mean squared error (MSE)"
    SIGMOID_CROSS_ENTROPY = "Sigmoid cross entropy"


class Metric(StrEnum):
    BINARY_ACCURACY = "Binary accuracy"
    BINARY_CROSS_ENTROPY = "Binary cros-sentropy"
    CATEGORICAL_ACCURACY = "Categorical accuracy"
    CATEGORICAL_CROSS_ENTROPY = "Categorical cross-entropy"
    COSINE_PROXIMITY = "Cosine proximity"
    MEAN_ABSOLUTE_ERROR = "Mean absolute error (MAE)"
    MEAN_ABSOLUTE_PERCENTAGE_ERROR = "Mean absolute percentage error"
    MEAN_SQUARED_ERROR = "Mean squared error"
    PRECISION = "Precision"
    RECALL = "Recall"
    SPARSE_CATEGORICAL_ACCURACY = "Sparse categorical accuracy"


class OptimizationAlgorithm(StrEnum):
    ADADELTA = "Adadelta"
    ADAGRAD = "Adagrad"
    ADAM = "Adam"
    ADAMAX = "Adamax"
    MOMENTUM = "Momentum"
    RMSPROP = "RMSProp"
    SGD = "Stochastic gradient descent (SGD)"


class NormalizeOptions(WireModel):
    normalize: bool
    """Scale intensities to 0..1 by the bit depth."""
    center: bool


class CropOptions(WireModel):
    num_crops: int
    crop_schema: CropSchema


class PreprocessSettings(WireModel):
    shuffle: bool
    input_shape: Shape
    normalize_options: NormalizeOptions
    crop_options: CropOptions
    training_percentage: float
    """The share of labeled, unassigned items that go to training; the rest validate."""


class OptimizerSettings(WireModel):
    learning_rate: float
    loss_function: LossFunction
    metrics: list[Metric]
    optimization_algorithm: OptimizationAlgorithm
    epochs: int
    batch_size: int


class ClassifierHyperparameters(WireModel):
    preprocess: PreprocessSettings
    optimizer: OptimizerSettings


# ── Runs ────────────────────────────────────────────────────────────────────


class RunStatus(StrEnum):
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    STOPPED = "stopped"
    """Stopped by the user; the epochs so far count."""
    FAILED = "failed"


class RunTrigger(StrEnum):
    FRESH = "fresh"
    CONTINUE = "continue"
    HITL_CORRECTION = "hitl-correction"
    """Continued after the user corrected predictions of the previous run."""
    IMPORT = "import"


class RunHistoryEpoch(WireModel):
    epoch: int
    loss: float
    val_loss: float
    accuracy: float
    val_accuracy: float


class EvaluationResult(WireModel):
    confusion_matrix: list[list[float]]
    accuracy: float
    cross_entropy: float
    precision: float
    recall: float
    f1_score: float


class RunHyperparameterSnapshot(WireModel):
    architecture: str
    """The architecture's model id."""
    optimizer: OptimizerSettings
    preprocess: PreprocessSettings


class Run(WireModel):
    id: str
    parent_run_id: str | None = None
    started_at: str
    """ISO timestamp."""
    finished_at: str | None = None
    status: RunStatus
    trigger: RunTrigger
    seed: int | None = None
    app_version: str
    framework_version: str
    device: str
    """Where it trained: a tfjs backend name, or a torch device."""
    hyperparameters: RunHyperparameterSnapshot
    class_map: dict[str, str]
    """Output class index (as a string key) → category id."""
    training_fingerprint: str
    validation_fingerprint: str
    """SHA-256 over the sorted ``id:categoryId`` lines of each set."""
    val_ids: list[str]
    category_set_hash: str
    history: list[RunHistoryEpoch]
    eval_results: EvaluationResult | None = None
    weights_ref: str | None = None


# ── Classifiers ─────────────────────────────────────────────────────────────


class ClassifierActivity(StrEnum):
    TRAINING = "training"
    PREDICTING = "predicting"
    EVALUATING = "evaluating"


class ModelLayer(WireModel):
    layer_name: str
    output_shape: str
    parameters: int
    trainable: bool


class Classifier(WireModel):
    id: str
    target_id: str
    """The kind whose objects it labels, or ``IMAGE_TARGET_ID``."""
    name: str
    """Unique within the project; what the user sees."""
    architecture_id: str
    """The listed model it was built from."""
    framework: str
    hyperparameters: ClassifierHyperparameters
    class_map: dict[str, str] | None = None
    """Output class index → category id; unset until mapped (an imported model)."""
    classes: list[str]
    """Names of the output classes, in index order; empty until built."""
    confidence_threshold: float
    trained: bool
    trainable: bool
    valid: bool
    """False once the target's categories changed after a run; a new classifier is needed."""
    init_seed: int | None = None
    summary: list[ModelLayer] | None = None
    busy: ClassifierActivity | None = None
    """What a job is doing with it right now."""
    runs: list[Run]


# ── Requests and results ────────────────────────────────────────────────────


class ClassifierCreateRequest(WireModel):
    target_id: str
    name: str
    architecture_id: str
    hyperparameters: ClassifierHyperparameters
    seed: int | None = None


class ClassifierUpdateRequest(WireModel):
    """Changes to a classifier's settings between runs; absent fields stay."""

    classifier_id: str
    hyperparameters: ClassifierHyperparameters | None = None
    class_map: dict[str, str] | None = None
    confidence_threshold: float | None = None


class ClassifierRequest(WireModel):
    classifier_id: str


class ClassifierFitRequest(WireModel):
    """Trains on the target's labeled items. The backend splits those still
    unassigned into training and validation per category by the
    hyperparameters' percentage (shuffled by ``seed``), records the
    partitions, and announces epochs as ``classifiers/didEpoch``."""

    classifier_id: str
    seed: int | None = None


class ClassifierFitSummary(WireModel):
    job_id: str | None = None
    """Absent when cancelled before anything started."""
    run_id: str | None = None
    status: RunStatus
    eval_results: EvaluationResult | None = None


class ClassifierPredictRequest(WireModel):
    """Labels the target's unlabeled items, or those of ``ids`` that are
    unlabeled, with the classifier's predictions; they stay in the inference
    partition until accepted or cleared."""

    classifier_id: str
    ids: list[str] | None = None


class ClassifierPredictSummary(WireModel):
    job_id: str | None = None
    predicted: int
    cancelled: bool


class ClassificationTargetRequest(WireModel):
    target_id: str


class ClassifiersResult(WireModel):
    classifiers: list[Classifier]


class ChangedResult(WireModel):
    changed: int


class ClassifierExportResult(WireModel):
    file_name: str
    mime: str
    data: bytes
    """A zip: the framework's saved model, the runs and a manifest."""


class ClassifierImportRequest(WireModel):
    target_id: str
    data: bytes
    name: str | None = None
    """Overrides the name in the archive's manifest."""


# ── Item updates ────────────────────────────────────────────────────────────
#
# What a categorization or a prediction changed, as partial records: the
# fields a category change always rewrites. An absent prediction field was
# cleared.


class ImageUpdate(WireModel):
    id: str
    category_id: str
    partition: Partition
    prediction_confidence: float | None = None
    predicted_at_run_id: str | None = None
    prediction_corrected: PredictionCorrection | None = None


class VolumeUpdate(WireModel):
    id: str
    kind_id: str
    category_id: str
    prediction_confidence: float | None = None
    predicted_at_run_id: str | None = None
    prediction_corrected: PredictionCorrection | None = None
    rev: int | None = None
    """The volume's revision after the change, so a client holding a copy
    can commit against it later without a spurious conflict."""


class AnnotationUpdate(WireModel):
    id: str
    partition: Partition

