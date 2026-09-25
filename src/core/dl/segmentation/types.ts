import type { AnnotationObject } from "core/entities";

import type { LoadCB } from "utils/types";

import type { Token } from "../cancel";
import type { ApiResult, InferenceInput, SerializedModelData } from "../types";

export const MODELS = [
  "Cellpose-SAM",
  "StardistVHE",
  "StardistFluo",
  "GlandSegmentation",
  "COCO-SSD",
] as const;

export type ModelName = (typeof MODELS)[number];

export type ModelDisplayInfo = {
  name: ModelName;
  displayName: string;
  description: string;
  use: string;
  output: { name: string; url?: string };
  sources: Array<{ text: string; url: string }>;
  cite?: Array<{ text: string; url: string }>;
  cloudWarning?: string;
};

/*
 * How a model consumes image channels.
 *
 * - `fixed`: the graph needs exactly `count` planes, so the UI makes the user
 *   map one image channel onto each model input (padding by repetition when the
 *   image has fewer).
 * - `passthrough`: the model is channel-agnostic and takes the source channels
 *   as-is, up to `maxChannels`. No per-input mapping, no padding.
 */
export type ChannelPolicy =
  | { mode: "fixed"; count: number }
  | { mode: "passthrough"; maxChannels: number };

/* Plain-data guard so a field can depend on another field's value. */
type SegmenterOptionCondition = {
  key: string;
  equals: string | number | boolean;
};

type SegmenterOptionFieldBase = {
  key: string;
  label: string;
  help?: string;
  advanced?: boolean;
  visibleWhen?: SegmenterOptionCondition;
};

type SegmenterNumberOptionField = SegmenterOptionFieldBase & {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  /* Allows an empty input, committed as `undefined` (library default). */
  optional?: boolean;
  emptyLabel?: string;
  control?: "text" | "slider";
};

type SegmenterBoolOptionField = SegmenterOptionFieldBase & {
  type: "boolean";
  default: boolean;
};

type SegmenterSelectOptionfield = SegmenterOptionFieldBase & {
  type: "select";
  default: string;
  choices: Array<{ value: string; label: string }>;
};

/*
 * A 1-based index into the channels actually sent to the model, resolved by
 * the renderer against the live channel selection; 0 carries a field-specific
 * meaning named by `zeroLabel` ("Grayscale (mean)" for chan, "None" for
 * chan2). Its choices depend on what the user is sending, which only the UI
 * knows — hence a distinct type rather than a `select` with baked-in choices.
 */
type SegmenterChannelOptionField = SegmenterOptionFieldBase & {
  type: "channelIndex";
  default: number;
  zeroLabel: string;
};

/*
 * A model's inference knobs, declared as data so the UI can render them without
 * importing model code, and so the whole schema survives the structured clone
 * across the Comlink boundary. That rules out validator callbacks and
 * choice-producing functions.
 */
export type SegmenterOptionField =
  | SegmenterNumberOptionField
  | SegmenterBoolOptionField
  | SegmenterSelectOptionfield
  | SegmenterChannelOptionField;

export type SegmenterOptionGroup = {
  id: string;
  label: string;
  fields: SegmenterOptionField[];
  describesChannels?: boolean;
};

export type SegmenterOptionSchema = { groups: SegmenterOptionGroup[] };

export type SegmenterOptionValues = Record<
  string,
  number | boolean | string | undefined
>;

export type SegmentationState = "idle" | "loading" | "predicting";

export type SegmentaionModelDetails = {
  name: ModelName;
  displayName: string;
  kind?: string | Array<string>;
  modelLoaded: boolean;
  channelPolicy: ChannelPolicy;
  /* Absent => the model exposes no inference knobs, and no panel is rendered. */
  optionSchema?: SegmenterOptionSchema;
  // True only when `loadModel` actually stops on abort. Drives whether the
  // load task is offered as cancellable; see `ModelArgs.cancellableLoad`.
  cancellableLoad: boolean;
};

export type PredictedAnnotationObject = Omit<
  AnnotationObject,
  "imageId" | "planeId" | "shape" | "volumeId"
> & { kindName: string };
export type SegmentationResults = {
  cancelled?: boolean;
  annotations: Array<Array<PredictedAnnotationObject>>;
};
export interface ISegmenterApi {
  // registry reads
  getModelNames(): Promise<ApiResult<string[]>>;
  getModelInfo(name: ModelName): Promise<ApiResult<SegmentaionModelDetails>>;
  hasModel(name: ModelName): Promise<ApiResult<boolean>>;
  getAvailableSegmentationModels(): Promise<
    ApiResult<Record<string, SegmentaionModelDetails>>
  >;

  /*
   * Segmentation Ops
   */
  loadModel(modelName: ModelName, loadCB?: LoadCB): Promise<ApiResult<void>>;
  /*
   * Aborts an in-flight `loadModel`. An `AbortSignal` is not structured-
   * cloneable, so it cannot be handed to the worker; the controller lives
   * worker-side instead and this call trips it over Comlink.
   */
  cancelLoadModel(modelName: ModelName): Promise<ApiResult<void>>;
  predict(
    name: ModelName,
    items: InferenceInput[],
    cancelToken: Token,
    loadCB?: LoadCB,
    options?: SegmenterOptionValues,
  ): Promise<ApiResult<SegmentationResults>>;

  // model I/O

  getSavedModelData(name: ModelName): Promise<ApiResult<SerializedModelData>>;
  getZippedModelsBuffer(): Promise<ApiResult<ArrayBuffer>>;
  destroy(): Promise<ApiResult<void>>;
}
