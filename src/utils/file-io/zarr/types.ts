// ============================================================
// v0.1 / v0.2 / v1.1 Zarr attribute names (older formats)
// ============================================================

// v0.2 and v1.1 share the same attribute names (unified "thing" model)
export const ZARR_THING = {
  ThingNames: "thing_names",
  ThingId: "thing_id",
  ActivePlane: "active_plane",
  ClassCategoryId: "class_category_id",
  ClassifierPartition: "classifier_partition",
  Kind: "kind",
  Bbox: "bbox",
  Mask: "mask",
  ImageId: "image_id",
  Contents: "contents",
  BitDepth: "bit_depth",
} as const;
export type ZARR_THING_ATTRS = (typeof ZARR_THING)[keyof typeof ZARR_THING];

// v0.1 uses separate groups for images and annotations
export const ZARR_V01_IMAGE = {
  ImageNames: "image_names",
  ImageId: "image_id",
  ActivePlane: "active_plane",
  ClassCategoryId: "class_category_id",
  BitDepth: "bit_depth",
} as const;
export type ZARR_V01_IMAGE =
  (typeof ZARR_V01_IMAGE)[keyof typeof ZARR_V01_IMAGE];

export const ZARR_V01_ANNOTATION = {
  AnnotationId: "annotation_id",
  AnnotationCategoryId: "annotation_category_id",
  ImageId: "image_id",
} as const;
export type ZARR_V01_ANNOTATION =
  (typeof ZARR_V01_ANNOTATION)[keyof typeof ZARR_V01_ANNOTATION];

// Category/kind attrs for v0.2/v1.1 (slightly different from v1.2)
export const ZARR_V02_CATEGORY = {
  CategoryId: "category_id",
  Color: "color",
  Name: "name",
  Kind: "kind",
  Contents: "contents",
} as const;
export type ZARR_V02_CATEGORY_ATTRS =
  (typeof ZARR_V02_CATEGORY)[keyof typeof ZARR_V02_CATEGORY];

export const ZARR_V02_KIND = {
  KindId: "kind_id",
  Contents: "contents",
  Categories: "categories",
  UnknownCategoryId: "unknown_category_id",
  DisplayName: "display_name",
} as const;
export type ZARR_V02_KIND_ATTRS =
  (typeof ZARR_V02_KIND)[keyof typeof ZARR_V02_KIND];

// ============================================================
// v2 Zarr names (current format)
// ============================================================
//
// Shared by `version-writers/writeV2.ts` and `version-readers/readV2.ts` —
// the two are exact inverses, so every literal lives here rather than being
// typed twice.
//
// Conventions carried over from the older formats:
//  - snake_case attribute names
//  - `_B` suffix marks a boolean stored as 0/1
//  - each entity collection is one group whose attrs are parallel arrays,
//    indexed consistently across every attr in that group
//  - optional fields use `null` as the placeholder within a parallel array

/** Group names, relative to their parent. */
export const ZARR_V2_GROUP = {
  Data: "data",
  Classifier: "classifier",
  ImageSeries: "image_series",
  Images: "images",
  Planes: "planes",
  Kinds: "kinds",
  Categories: "categories",
  ChannelMetas: "channel_metas",
  Channels: "channels",
  AnnotationVolumes: "annotation_volumes",
  Annotations: "annotations",
  ModelInfo: "model_info",
  PreprocessSettings: "preprocessing_settings",
  NormalizeOptions: "normalize_options",
  CropOptions: "crop_options",
  OptimizerSettings: "optimizer_settings",
  Runs: "runs",
  Hyperparameters: "hyperparameters",
  EvalResults: "eval_results",
} as const;

/** Dataset (zarr array) names, relative to their parent group. */
export const ZARR_V2_DATASET = {
  ChannelData: "data",
  ChannelHistogram: "histogram",
  AnnotationMasks: "masks",
  RunHistory: "history",
  ConfusionMatrix: "confusion_matrix",
} as const;

/** Root group attrs. */
export const ZARR_V2_ROOT = {
  Version: "version",
  AppVersion: "app_version",
} as const;

/** `data/` group attrs — the experiment is a singleton, so these are scalars. */
export const ZARR_V2_DATA = {
  ExperimentId: "experiment_id",
  ExperimentName: "experiment_name",
  ExperimentChannels: "experiment_channels",
} as const;

/** `Shape` decomposed into four parallel arrays. */
export const ZARR_V2_SHAPE = {
  Planes: "shape_planes",
  Height: "shape_height",
  Width: "shape_width",
  Channels: "shape_channels",
} as const;

/** `PredictionCorrection` decomposed into four parallel arrays. */
export const ZARR_V2_PREDICTION_CORRECTION = {
  FromRunId: "prediction_corrected_from_run_id",
  CategoryId: "prediction_corrected_category_id",
  Confidence: "prediction_corrected_confidence",
  At: "prediction_corrected_at",
} as const;

export const ZARR_V2_IMAGE_SERIES = {
  Id: "series_id",
  ExperimentId: "experiment_id",
  Name: "name",
  BitDepth: "bit_depth",
  TimeSeries: "time_series_B",
  ActiveImageId: "active_image_id",
} as const;

export const ZARR_V2_IMAGE = {
  Id: "image_id",
  Name: "name",
  SeriesId: "series_id",
  CategoryId: "category_id",
  ActivePlaneId: "active_plane_id",
  Timepoint: "timepoint",
  BitDepth: "bit_depth",
  Partition: "partition",
  PredictionConfidence: "prediction_confidence",
  PredictedAtRunId: "predicted_at_run_id",
} as const;

export const ZARR_V2_PLANE = {
  Id: "plane_id",
  ImageId: "image_id",
  ZIndex: "z_index",
} as const;

export const ZARR_V2_KIND = {
  Id: "kind_id",
  Name: "name",
  UnknownCategoryId: "unknown_category_id",
} as const;

export const ZARR_V2_CATEGORY = {
  Id: "category_id",
  Name: "name",
  Color: "color",
  IsUnknown: "is_unknown_B",
  Type: "type",
  KindId: "kind_id",
} as const;

export const ZARR_V2_CHANNEL_META = {
  Id: "channel_meta_id",
  Name: "name",
  BitDepth: "bit_depth",
  ColorMap: "color_map",
  Visible: "visible_B",
  MinValue: "min_value",
  MaxValue: "max_value",
  RampMin: "ramp_min",
  RampMax: "ramp_max",
  RampMinLimit: "ramp_min_limit",
  RampMaxLimit: "ramp_max_limit",
} as const;

export const ZARR_V2_CHANNEL = {
  Id: "channel_id",
  PlaneId: "plane_id",
  ChannelMetaId: "channel_meta_id",
  Name: "name",
  DType: "dtype",
  BitDepth: "bit_depth",
  Width: "width",
  Height: "height",
  MinValue: "min_value",
  MaxValue: "max_value",
  Total: "total",
  Mean: "mean",
  Median: "median",
  Std: "std",
  Mad: "mad",
  LowerQuartile: "lower_quartile",
  UpperQuartile: "upper_quartile",
  Features: "features",
} as const;

export const ZARR_V2_ANNOTATION_VOLUME = {
  Id: "volume_id",
  ImageId: "image_id",
  KindId: "kind_id",
  CategoryId: "category_id",
  Timepoint: "timepoint",
  PredictionConfidence: "prediction_confidence",
  PredictedAtRunId: "predicted_at_run_id",
} as const;

export const ZARR_V2_ANNOTATION = {
  Id: "annotation_id",
  PlaneId: "plane_id",
  ImageId: "image_id",
  VolumeId: "volume_id",
  Partition: "partition",
  BBox: "bbox",
  /**
   * `encodedMask` is ragged, so all RLE runs are concatenated into the
   * `masks` dataset and sliced back out with these [start, end) offsets.
   */
  MaskOffsets: "mask_offsets",
} as const;

export const ZARR_V2_CLASSIFIER = {
  Kinds: "classifier_kinds",
  Models: "models",
  ModelTargetId: "model_target_id",
  ModelTargetName: "model_target_name",
  ActiveModel: "active_model",
  NewModelArch: "new_model_arch",
  Status: "status",
} as const;

export const ZARR_V2_MODEL_INFO = {
  Name: "name",
  ClassMap: "class_map",
  ConfidenceThreshold: "confidence_threshold",
  Valid: "valid_B",
  InitSeed: "init_seed",
  Trained: "trained_B",
} as const;

export const ZARR_V2_PREPROCESS = {
  Shuffle: "shuffle_B",
  TrainingPercent: "training_percent",
  /**
   * Written as a plain JSON attr array, not a Uint8Array dataset — the v1.1
   * writer used Uint8 here, which silently truncated any input larger than
   * 255x255.
   */
  InputShape: "input_shape",
  Normalize: "normalize_B",
  Center: "center_B",
  NumCrops: "num_crops",
  CropSchema: "crop_schema",
} as const;

export const ZARR_V2_OPTIMIZER = {
  LearningRate: "learning_rate",
  LossFunction: "loss_function",
  Metrics: "metrics",
  OptimizationAlgorithm: "optimization_algorithm",
  Epochs: "epochs",
  BatchSize: "batch_size",
} as const;

/** `runs/` group attrs. */
export const ZARR_V2_RUNS = {
  RunIds: "run_ids",
} as const;

/** `runs/<runId>/` group attrs. */
export const ZARR_V2_RUN = {
  Id: "id",
  ParentRunId: "parent_run_id",
  StartedAt: "started_at",
  FinishedAt: "finished_at",
  Status: "status",
  Trigger: "trigger",
  Seed: "seed",
  AppVersion: "app_version",
  TfjsVersion: "tfjs_version",
  Backend: "backend",
  ClassMap: "class_map",
  TrainingFingerprint: "training_fingerprint",
  ValidationFingerprint: "validation_fingerprint",
  ValIds: "val_ids",
  CategorySetHash: "category_set_hash",
  WeightsRef: "weights_ref",
  Architecture: "architecture",
} as const;

/** `runs/<runId>/eval_results/` group attrs. */
export const ZARR_V2_EVAL = {
  Accuracy: "accuracy",
  CrossEntropy: "cross_entropy",
  Precision: "precision",
  Recall: "recall",
  F1Score: "f1_score",
} as const;

/** Column order of the `runs/<runId>/history` dataset. */
export const ZARR_V2_RUN_HISTORY_COLUMNS = [
  "epoch",
  "loss",
  "valLoss",
  "accuracy",
  "valAccuracy",
] as const;
