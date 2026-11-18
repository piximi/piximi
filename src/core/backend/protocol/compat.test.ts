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

import type { Capability } from "../capabilities";
import type { BackendEvent } from "../events";
import type { Job } from "../jobs";
import type {
  AnnotationCountGroup,
  AnnotationQuery,
  AnnotationSort,
  ChannelDisplay,
  Counts,
  ImageCountGroup,
  ImageQuery,
  ImageSort,
  ModelStatus,
  ModelTask,
  Page,
  PageRequest,
  ProjectSummary,
  SortDirection,
  RenderRequest,
  SegmentationModelDescriptor,
  SegmentationRunRequest,
  SegmentationRunSummary,
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

  // ── Query and render ──────────────────────────────────────────────────────
  Assert<Equivalent<P.PageRequest, PageRequest>>,
  Assert<Equivalent<P.SortDirection, SortDirection>>,
  Assert<Equivalent<P.ImageSort, ImageSort>>,
  Assert<Equivalent<P.AnnotationSort, AnnotationSort>>,
  Assert<Equivalent<P.ImageQuery, WithPartitions<ImageQuery>>>,
  Assert<Equivalent<P.AnnotationQuery, WithPartitions<AnnotationQuery>>>,
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
      Omit<P.SegmentationModelDescriptor, "outputPolicy" | "channelPolicy">,
      Omit<SegmentationModelDescriptor, "outputPolicy" | "channelPolicy">
    >
  >,
  Assert<
    Equivalent<
      Omit<P.SegmentationRunRequest, "options">,
      Omit<SegmentationRunRequest, "options">
    >
  >,
  Assert<Equivalent<P.SegmentationRunSummary, SegmentationRunSummary>>,
];

describe("protocol compat", () => {
  it("holds for every wire type (enforced by tsc through `Checks`)", () => {
    expectTypeOf<Checks[number]>().toEqualTypeOf<true>();
    expect(true).toBe(true);
  });
});
