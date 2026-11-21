import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  Channel,
  ChannelMeta,
  Experiment,
  ImageCategory,
  ImageObject,
  ImageSeries,
  Kind,
  Partition,
  Plane,
  PredictionCorrection,
  Shape,
} from "core/entities";
import type { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import type { OUTPUT_MODE } from "core/dl/segmentation/models/consts";
import type {
  SegmenterOptionField,
  SegmenterOptionGroup,
  SegmenterOptionSchema,
} from "core/dl/segmentation/types";
import type {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "core/dl/enums";
import type {
  Classifier,
  ClassifierHyperparameters,
  EvaluationResult,
  ModelLayerData,
  OptimizerSettings,
  PreprocessSettings,
  Run,
  RunHistoryEpoch,
  RunHyperparameterSnapshot,
} from "core/dl/classification/types";
import type { AnnotationExportType } from "core/file-io/export/enums";

import type { Capability } from "../capabilities";
import type { BackendEvent } from "../events";
import type { Job } from "../jobs";
import type {
  AnnotationChangeSet,
  AnnotationCountGroup,
  AnnotationGeometryChange,
  AnnotationQuery,
  AnnotationSort,
  AnnotationUpdate,
  Changed,
  CommitConflict,
  CommitResult,
  EntityRef,
  ImageChange,
  VolumeCategoryChange,
  ChannelDisplay,
  ClassifierCreateRequest,
  ClassifierExport,
  ClassifierFitSummary,
  ClassifierPredictSummary,
  Counts,
  AddPathsRequest,
  AnnotationsExportRequest,
  ExportedFile,
  DimensionConfig,
  DimensionHint,
  DimensionOrder,
  DirectoryEntry,
  DirectoryListing,
  IngestFailure,
  IngestSummary,
  PathInspection,
  UploadFile,
  ImageCountGroup,
  ImageQuery,
  MeasurementScope,
  MeasurementTable,
  MeasurementTableRequest,
  MeasurementsComputeRequest,
  MeasurementsComputeSummary,
  ImageSort,
  ImageUpdate,
  ModelDescriptor,
  ModelStatus,
  ModelTask,
  Page,
  PageRequest,
  ProjectSummary,
  SortDirection,
  RenderRequest,
  SegmentationRunRequest,
  SegmentationRunSummary,
  VolumeUpdate,
} from "../types";
import type * as P from "./generated";

/*
 * Compile-time proof that the wire types generated from
 * python/packages/piximi-schema line up with the frontend's domain types,
 * which is what lets the remote backend pass values straight through. If a
 * field is added or renamed on either side, `pnpm typecheck` fails here.
 *
 * "Line up" means mutually assignable. Two things differ by design and are
 * mapped by the remote backend instead of asserted here:
 *  - String enums (`Partition`, `CHANNEL_MODE`, `OUTPUT_MODE`) are nominal in
 *    TypeScript; the wire carries their values, so those fields are compared
 *    through template-literal types.
 *  - `Partial<Record<K, number>>` measurement maps are index signatures on the
 *    wire, and option values use `null` where the domain uses `undefined`.
 */

type Equivalent<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
type Assert<T extends true> = T;

type Values<E extends string> = `${E}`;
/* Only two of CHANNEL_MODE's members are policy modes. */
type PolicyModes = `${CHANNEL_MODE.FIXED}` | `${CHANNEL_MODE.PASSTHROUGH}`;
type WithPartition<T extends { partition: Partition }> = Omit<
  T,
  "partition"
> & {
  partition: Values<Partition>;
};
type WithPartitions<T extends { partitions?: Partition[] }> = Omit<
  T,
  "partitions"
> & {
  partitions?: Values<Partition>[];
};
type Unmeasured<T> = Omit<T, "features" | "intensityMeasurements">;
/* Hyperparameters hold several string enums; the wire carries their values. */
type WireOptimizer = Omit<
  OptimizerSettings,
  "lossFunction" | "metrics" | "optimizationAlgorithm"
> & {
  lossFunction: Values<LossFunction>;
  metrics: Values<Metric>[];
  optimizationAlgorithm: Values<OptimizationAlgorithm>;
};
type WirePreprocess = Omit<PreprocessSettings, "cropOptions"> & {
  cropOptions: { numCrops: number; cropSchema: Values<CropSchema> };
};
type WireHyperparameters = {
  [K in keyof ClassifierHyperparameters]: K extends "optimizer"
    ? WireOptimizer
    : WirePreprocess;
};
type WireRun = Omit<Run, "hyperparameters"> & {
  hyperparameters: Omit<RunHyperparameterSnapshot, "optimizer" | "preprocess"> &
    WireHyperparameters;
};
type WireClassifier = Omit<Classifier, "hyperparameters" | "runs"> & {
  hyperparameters: WireHyperparameters;
  runs: WireRun[];
};

/* Every entry must be `true`; `Assert` makes `tsc` say which one is not. */
type Checks = [
  // ── Vocabularies ──────────────────────────────────────────────────────────
  Assert<Equivalent<P.Partition, Values<Partition>>>,
  Assert<Equivalent<P.Capability, Capability>>,
  Assert<Equivalent<PolicyModes, "fixed" | "passthrough">>,
  Assert<Equivalent<Values<OUTPUT_MODE>, "single" | "classes">>,

  // ── Entities ──────────────────────────────────────────────────────────────
  Assert<Equivalent<P.Shape, Shape>>,
  Assert<Equivalent<P.Experiment, Experiment>>,
  Assert<Equivalent<P.ImageSeries, ImageSeries>>,
  Assert<Equivalent<P.ImageObject, WithPartition<ImageObject>>>,
  Assert<Equivalent<P.Plane, Plane>>,
  Assert<
    Equivalent<
      Unmeasured<P.Channel>,
      Unmeasured<Omit<Channel, "storageReference">>
    >
  >,
  Assert<Equivalent<P.ChannelMeta, ChannelMeta>>,
  Assert<Equivalent<P.Kind, Kind>>,
  Assert<Equivalent<P.ImageCategory, ImageCategory>>,
  Assert<Equivalent<P.AnnotationCategory, AnnotationCategory>>,
  Assert<Equivalent<P.PredictionCorrection, PredictionCorrection>>,
  Assert<Equivalent<P.AnnotationVolume, AnnotationVolume>>,
  Assert<
    Equivalent<
      Unmeasured<P.AnnotationObject>,
      Unmeasured<WithPartition<Omit<AnnotationObject, "decodedMask">>>
    >
  >,
  Assert<
    Equivalent<
      Unmeasured<P.AnnotationHeader>,
      Unmeasured<
        WithPartition<Omit<AnnotationObject, "decodedMask" | "encodedMask">>
      >
    >
  >,

  // ── Jobs and events ───────────────────────────────────────────────────────
  Assert<Equivalent<P.Job, Job>>,
  Assert<
    Equivalent<P.KindsDidAdd, Extract<BackendEvent, { type: "kinds/didAdd" }>>
  >,
  Assert<
    Equivalent<
      P.AnnotationsDidAdd["volumes"],
      Extract<BackendEvent, { type: "annotations/didAdd" }>["volumes"]
    >
  >,
  Assert<
    Equivalent<
      P.JobsDidUpdate,
      Extract<BackendEvent, { type: "jobs/didUpdate" }>
    >
  >,
  Assert<
    Equivalent<
      Omit<
        P.ModelsDidChange["models"][number],
        "outputPolicy" | "channelPolicy"
      >,
      Omit<
        Extract<BackendEvent, { type: "models/didChange" }>["models"][number],
        "outputPolicy" | "channelPolicy"
      >
    >
  >,

  Assert<
    Equivalent<
      P.ImagesDidRemove,
      Extract<BackendEvent, { type: "images/didRemove" }>
    >
  >,
  Assert<
    Equivalent<
      P.AnnotationsDidRemove,
      Extract<BackendEvent, { type: "annotations/didRemove" }>
    >
  >,
  Assert<
    Equivalent<
      P.KindsDidChange,
      Extract<BackendEvent, { type: "kinds/didChange" }>
    >
  >,
  Assert<
    Equivalent<
      P.KindsDidRemove,
      Extract<BackendEvent, { type: "kinds/didRemove" }>
    >
  >,
  Assert<
    Equivalent<
      P.ImagesDidChange,
      Omit<Extract<BackendEvent, { type: "images/didChange" }>, "images"> & {
        images: WithPartition<ImageObject>[];
      }
    >
  >,
  Assert<
    Equivalent<
      P.ProjectDidChange,
      Extract<BackendEvent, { type: "project/didChange" }>
    >
  >,
  Assert<
    Equivalent<
      Omit<P.AnnotationsDidUpdate, "annotations" | "headers">,
      Omit<
        Extract<BackendEvent, { type: "annotations/didUpdate" }>,
        "annotations" | "headers"
      >
    >
  >,

  // ── Editing ───────────────────────────────────────────────────────────────
  Assert<Equivalent<P.EntityRef, EntityRef>>,
  Assert<Equivalent<P.VolumeCategoryChange, VolumeCategoryChange>>,
  Assert<Equivalent<P.AnnotationGeometryChange, AnnotationGeometryChange>>,
  Assert<Equivalent<P.CommitConflict, CommitConflict>>,
  Assert<Equivalent<P.CommitResult, CommitResult>>,
  // The wire defaults each list to empty; the domain spells them out.
  Assert<Equivalent<P.AnnotationsCommitParams["imageIds"], string[]>>,
  Assert<Equivalent<P.AnnotationsCommitParams["force"], boolean | undefined>>,
  Assert<Equivalent<Required<P.VolumeChanges>, AnnotationChangeSet["volumes"]>>,
  Assert<
    Equivalent<
      Required<Omit<P.AnnotationChanges, "created">>,
      Omit<AnnotationChangeSet["annotations"], "created">
    >
  >,
  Assert<
    Equivalent<
      P.ImageChange,
      Omit<ImageChange, "partition"> & { partition?: Values<Partition> }
    >
  >,
  Assert<Equivalent<P.KindsResult, { kinds: Kind[] }>>,
  Assert<Equivalent<P.ExperimentResult, { experiment: Experiment }>>,

  // ── Ingest ────────────────────────────────────────────────────────────────
  Assert<Equivalent<P.DimensionOrder, DimensionOrder>>,
  Assert<Equivalent<P.DimensionConfig, DimensionConfig>>,
  Assert<Equivalent<P.IngestFailure, IngestFailure>>,
  Assert<Equivalent<P.IngestSummary, IngestSummary>>,
  Assert<Equivalent<P.DirectoryEntry, DirectoryEntry>>,
  Assert<Equivalent<P.DirectoryListing, DirectoryListing>>,
  Assert<Equivalent<P.DimensionHint, DimensionHint>>,
  Assert<Equivalent<P.PathInspection, PathInspection>>,
  Assert<Equivalent<Omit<P.AddPathsParams, "progressToken">, AddPathsRequest>>,
  // The file's bytes are a `Blob | ArrayBuffer` in the app and bytes on the
  // wire; the remote backend reads them before sending.
  Assert<Equivalent<Omit<P.UploadFile, "data">, Omit<UploadFile, "data">>>,
  Assert<
    Equivalent<
      Omit<P.ImagesDidAdd, "records">,
      Omit<Extract<BackendEvent, { type: "images/didAdd" }>, "records">
    >
  >,

  // ── Export ────────────────────────────────────────────────────────────────
  Assert<Equivalent<P.AnnotationExportType, Values<AnnotationExportType>>>,
  Assert<Equivalent<P.FileExport, ExportedFile>>,
  Assert<
    Equivalent<
      Omit<P.AnnotationsExportRequest, "progressToken" | "type" | "query">,
      Omit<AnnotationsExportRequest, "type" | "query">
    >
  >,
  Assert<
    Equivalent<
      P.AnnotationsExportRequest["query"],
      WithPartitions<AnnotationQuery> | undefined
    >
  >,

  // ── Query and render ──────────────────────────────────────────────────────
  Assert<Equivalent<P.PageRequest, PageRequest>>,
  Assert<Equivalent<P.SortDirection, SortDirection>>,
  Assert<Equivalent<P.ImageSort, ImageSort>>,
  Assert<Equivalent<P.AnnotationSort, AnnotationSort>>,
  Assert<Equivalent<P.ImageQuery, WithPartitions<ImageQuery>>>,
  Assert<Equivalent<P.AnnotationQuery, WithPartitions<AnnotationQuery>>>,
  Assert<Equivalent<P.MeasurementScope, MeasurementScope>>,
  Assert<
    Equivalent<
      P.MeasurementTableRequest,
      Omit<MeasurementTableRequest, "imageQuery" | "annotationQuery"> & {
        imageQuery?: WithPartitions<ImageQuery>;
        annotationQuery?: WithPartitions<AnnotationQuery>;
      }
    >
  >,
  Assert<Equivalent<P.MeasurementsComputeSummary, MeasurementsComputeSummary>>,
  Assert<
    Equivalent<
      Omit<P.MeasurementsComputeParams, "progressToken">,
      Omit<
        MeasurementsComputeRequest,
        "annotationQuery" | "imageQuery" | "force"
      > & {
        annotationQuery?: WithPartitions<AnnotationQuery>;
        imageQuery?: WithPartitions<ImageQuery>;
        force?: boolean;
      }
    >
  >,
  Assert<
    Equivalent<
      P.MeasurementTable,
      Omit<MeasurementTable, "partitions"> & { partitions: Values<Partition>[] }
    >
  >,
  Assert<Equivalent<P.ImageCountGroup, ImageCountGroup>>,
  Assert<Equivalent<P.AnnotationCountGroup, AnnotationCountGroup>>,
  Assert<Equivalent<P.CountsResult, Counts>>,
  Assert<Equivalent<P.IdsResult, { ids: string[] }>>,
  Assert<Equivalent<P.ImagePage, Page<P.ImageRecord>>>,
  Assert<Equivalent<P.AnnotationPage, Page<P.AnnotationRecord>>>,
  Assert<Equivalent<P.ProjectSummary, ProjectSummary>>,
  Assert<Equivalent<P.ChannelDisplay, ChannelDisplay>>,
  Assert<Equivalent<P.RenderRequest, RenderRequest>>,

  // ── Segmentation ──────────────────────────────────────────────────────────
  Assert<
    Equivalent<
      | P.NumberOptionField
      | P.BooleanOptionField
      | P.SelectOptionField
      | P.ChannelIndexOptionField,
      SegmenterOptionField
    >
  >,
  Assert<Equivalent<P.OptionGroup, SegmenterOptionGroup>>,
  Assert<Equivalent<P.OptionSchema, SegmenterOptionSchema>>,
  Assert<Equivalent<P.ModelStatus, ModelStatus>>,
  Assert<Equivalent<P.ModelTask, ModelTask>>,
  Assert<
    Equivalent<
      Omit<P.ModelDescriptor, "outputPolicy" | "channelPolicy">,
      Omit<ModelDescriptor, "outputPolicy" | "channelPolicy">
    >
  >,
  Assert<
    Equivalent<
      Omit<P.SegmentationRunRequest, "options">,
      Omit<SegmentationRunRequest, "options">
    >
  >,
  Assert<Equivalent<P.SegmentationRunSummary, SegmentationRunSummary>>,

  // ── Classification ────────────────────────────────────────────────────────
  Assert<Equivalent<P.OptimizerSettings, WireOptimizer>>,
  Assert<Equivalent<P.PreprocessSettings, WirePreprocess>>,
  Assert<Equivalent<P.ClassifierHyperparameters, WireHyperparameters>>,
  Assert<Equivalent<P.RunHistoryEpoch, RunHistoryEpoch>>,
  Assert<Equivalent<P.EvaluationResult, EvaluationResult>>,
  Assert<Equivalent<P.ModelLayer, ModelLayerData>>,
  Assert<Equivalent<P.Run, WireRun>>,
  Assert<Equivalent<P.Classifier, WireClassifier>>,
  Assert<
    Equivalent<
      P.ClassifierCreateRequest,
      Omit<ClassifierCreateRequest, "hyperparameters"> & {
        hyperparameters: WireHyperparameters;
      }
    >
  >,
  Assert<Equivalent<P.ClassifierFitSummary, ClassifierFitSummary>>,
  Assert<Equivalent<P.ClassifierPredictSummary, ClassifierPredictSummary>>,
  Assert<Equivalent<P.ChangedResult, Changed>>,
  Assert<Equivalent<P.ClassifierExportResult, ClassifierExport>>,
  Assert<Equivalent<P.ImageUpdate, WithPartition<ImageUpdate>>>,
  Assert<Equivalent<P.VolumeUpdate, VolumeUpdate>>,
  Assert<Equivalent<P.AnnotationUpdate, WithPartition<AnnotationUpdate>>>,
  Assert<
    Equivalent<
      P.ClassifiersDidEpoch,
      Extract<BackendEvent, { type: "classifiers/didEpoch" }>
    >
  >,
  Assert<
    Equivalent<P.ClassifiersDidChange["classifiers"][number], WireClassifier>
  >,
  Assert<
    Equivalent<
      P.CategoriesDidChange["categories"][number],
      Extract<
        BackendEvent,
        { type: "categories/didChange" }
      >["categories"][number]
    >
  >,
];

describe("protocol compat", () => {
  it("holds for every wire type (enforced by tsc through `Checks`)", () => {
    expectTypeOf<Checks[number]>().toEqualTypeOf<true>();
    expect(true).toBe(true);
  });
});
