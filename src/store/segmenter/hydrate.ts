import { MODELS } from "core/dl/segmentation/types";
import { defaultOptionValues } from "core/dl/segmentation/optionUtils";
import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";

import { createBlankModelConfigMap } from "./segmenterSlice";

import type { SerializedSegmenterState } from "core/file-io/project-saver/types";
import type {
  ModelName,
  SegmentationModelDetails,
  SegmenterOptionType,
  SegmenterOptionValues,
} from "core/dl/segmentation/types";

import type { SegmenterModelConfig, SegmenterSliceState } from "./types";

const isModelName = (name: string): name is ModelName =>
  (MODELS as readonly string[]).includes(name);

/*
 * `undefined` is a legal option value — an `optional` number field committed
 * empty means "omit the key and let the library decide" — so it has to pass,
 * while anything a hand-edited or future-format file might carry (objects,
 * arrays, functions) must not.
 */
const isOptionValue = (value: unknown): value is SegmenterOptionType =>
  value === undefined ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  typeof value === "string";

const validOptionValues = (
  saved: SegmenterOptionValues,
): SegmenterOptionValues =>
  Object.fromEntries(
    Object.entries(saved).filter(([, value]) => isOptionValue(value)),
  );

export const getDefaultModelConfig = (
  model: SegmentationModelDetails,
): SegmenterModelConfig => {
  return {
    model: model.name,
    modelStatus: "idle",
    channelSelection: [],
    kindName:
      model.outputPolicy.mode === OUTPUT_MODE.SINGLE
        ? model.outputPolicy.defaultKindName
        : undefined,
    optionValues: defaultOptionValues(model.optionSchema),
  };
};
/*
 * A fresh config for each named model. Derived from the names rather than
 * written out key-by-key so a model added to `MODELS` cannot be forgotten here,
 * and so the project loader can build the same map before overlaying whatever
 * a saved project carried.
 */
export const createDefaultModelConfigMap = (
  modelNames: readonly ModelName[],
  modelDetails: Record<ModelName, SegmentationModelDetails>,
): Record<ModelName, SegmenterModelConfig> =>
  Object.fromEntries(
    modelNames.map((name) => [name, getDefaultModelConfig(modelDetails[name])]),
  ) as Record<ModelName, SegmenterModelConfig>;

/*
 * Turn what a project file carried into segmenter state.
 *
 * Tolerant by construction: the result always starts from a full set of fresh
 * configs, and a saved value is overlaid only when it still makes sense against
 * this build and this project. Anything else is dropped silently, so a stale
 * file can never leave the segmenter unusable.
 *
 * `loadedModel` is always `undefined`. The saved name is provenance only —
 * restoring it would claim a model is loaded when the worker registry holds no
 * weights for it.
 *
 * Note this cannot validate option *keys* against a model's `optionSchema`:
 * that schema lives in the segmenter worker and is unreachable from here. A key
 * retired from a schema therefore survives in state. It never renders, since
 * the options panel draws from the schema rather than from these values.
 */
export const hydrateSegmenterState = (
  saved: SerializedSegmenterState,
  availableChannelIds: Array<string>,
): SegmenterSliceState => {
  const configMap = createBlankModelConfigMap(MODELS);

  for (const config of saved.configs) {
    if (!isModelName(config.model)) continue;

    const target = configMap[config.model];

    // The policy-length check belongs to `reconcileChannelSelection`, which
    // runs when a model is actually loaded and its ChannelPolicy is known. All
    // that can be settled here is whether the ids still exist.
    target.channelSelection = config.channelSelection.every((id) =>
      availableChannelIds.includes(id),
    )
      ? config.channelSelection
      : [];

    target.optionValues = {
      ...target.optionValues,
      ...validOptionValues(config.optionValues),
    };
    if (typeof config.kindName === "string" && config.kindName.length > 0)
      target.kindName = config.kindName;
  }

  return { loadedModel: undefined, configMap };
};
