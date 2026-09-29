import { describe, expect, it } from "vitest";

import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { MODELS } from "core/dl/segmentation/types";

import {
  createModelConfigMap,
  getInitialModelConfig,
  segmenterSlice,
} from "./segmenterSlice";

import type { SegmentationModelDetails } from "core/dl/segmentation/types";

const model = {
  name: "Cellpose-SAM",
  displayName: "Model",
  channelPolicy: { mode: CHANNEL_MODE.FIXED, count: 2 },
  optionSchema: { groups: [] },
  cancellableLoad: true,
  modelLoaded: true,
} as unknown as SegmentationModelDetails;

/* Slots are only editable under a passthrough policy, hence the second fixture. */
const passthroughModel = {
  ...model,
  channelPolicy: { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 4 },
} as unknown as SegmentationModelDetails;

const CELLPOSE_INIT_CONFIG = getInitialModelConfig("Cellpose-SAM");

const { actions, reducer, getInitialState } = segmenterSlice;

describe("segmenterSlice", () => {
  it("starts with no loaded model and with all models idle", () => {
    const state = getInitialState();

    expect(state.loadedModel).toBeUndefined();
    const { statuses, channels } = Object.values(state.configMap).reduce(
      (res: { statuses: Array<string>; channels: Array<string> }, config) => {
        res.statuses.push(config.modelStatus);
        res.channels.push(...config.channelSelection);
        return res;
      },
      { statuses: [], channels: [] },
    );
    expect(statuses.every((s) => s === "idle")).toBeTruthy();
    expect(channels.length).toEqual(0);
  });

  it("seeds the channel selection when a model loads", () => {
    const state = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: model,
        availableChannelIds: ["a", "b", "c"],
      }),
    );

    expect(state.loadedModel).toBe(model);
    expect(state.configMap[model.name].channelSelection).toEqual(["a", "b"]);
  });

  it("sets a single option value without disturbing the others", () => {
    const state = reducer(
      reducer(
        getInitialState(),
        actions.modelLoaded({
          model: model,
          availableChannelIds: ["a", "b", "c"],
        }),
      ),
      actions.optionValueSet({ key: "a", value: 9 }),
    );

    expect(state.configMap[model.name].optionValues).toEqual({
      ...CELLPOSE_INIT_CONFIG.optionValues,
      a: 9,
    });
  });

  it("assigns a channel to a slot by index", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: model,
        availableChannelIds: ["a", "b", "c"],
      }),
    );
    const state = reducer(
      seeded,
      actions.channelSlotSet({ index: 1, id: "b" }),
    );

    expect(state.configMap[model.name].channelSelection).toEqual(["a", "b"]);
  });
  it("removes a channel slot by index", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: passthroughModel,
        availableChannelIds: ["a", "b", "c"],
      }),
    );
    const state = reducer(seeded, actions.channelSlotRemoved(0));

    expect(state.configMap[model.name].channelSelection).toEqual(["b", "c"]);
  });

  it("leaves the channel selection alone when the index is out of range", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: passthroughModel,
        availableChannelIds: ["a", "b", "c"],
      }),
    );
    const state = reducer(seeded, actions.channelSlotRemoved(3));

    expect(state.configMap[model.name].channelSelection).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps the last remaining slot", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: passthroughModel,
        availableChannelIds: ["a"],
      }),
    );
    const state = reducer(seeded, actions.channelSlotRemoved(0));

    expect(state.configMap[model.name].channelSelection).toEqual(["a"]);
  });

  it("adds a slot that duplicates the last channel", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: passthroughModel,
        availableChannelIds: ["a", "b"],
      }),
    );
    const state = reducer(seeded, actions.channelSlotAdded());

    expect(state.configMap[model.name].channelSelection).toEqual([
      "a",
      "b",
      "b",
    ]);
  });

  it("stops adding slots at the model's channel ceiling", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: passthroughModel,
        availableChannelIds: ["a", "b", "c", "d"],
      }),
    );
    const state = reducer(seeded, actions.channelSlotAdded());

    expect(state.configMap[model.name].channelSelection).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("does not add a slot when there is no channel to duplicate", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: passthroughModel,
        availableChannelIds: [],
      }),
    );
    const state = reducer(seeded, actions.channelSlotAdded());

    expect(state.configMap[model.name].channelSelection).toEqual([]);
  });

  it("ignores slot edits for a model that is not passthrough", () => {
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: model,
        availableChannelIds: ["a", "b", "c"],
      }),
    );
    const added = reducer(seeded, actions.channelSlotAdded());
    const removed = reducer(added, actions.channelSlotRemoved(0));

    expect(removed.configMap[model.name].channelSelection).toEqual(["a", "b"]);
  });

  it("ignores slot edits when no model is loaded", () => {
    const added = reducer(getInitialState(), actions.channelSlotAdded());
    const removed = reducer(added, actions.channelSlotRemoved(0));

    expect(removed).toEqual(getInitialState());
  });

  it("resets the loaded model", () => {
    const availableChannelIds = ["a", "_", "c"];
    const seeded = reducer(
      getInitialState(),
      actions.modelLoaded({
        model: model,
        availableChannelIds: availableChannelIds,
      }),
    );
    const state = reducer(
      reducer(seeded, actions.optionValueSet({ key: "a", value: 9 })),
      actions.channelSlotSet({ index: 1, id: "b" }),
    );

    expect(state.configMap[model.name].channelSelection).toEqual(["a", "b"]);
    expect(state.configMap[model.name].optionValues).toEqual({
      ...CELLPOSE_INIT_CONFIG.optionValues,
      a: 9,
    });

    const resetState = reducer(
      state,
      actions.configReset({ availableChannelIds }),
    );
    expect(resetState.configMap[model.name].channelSelection).toEqual([
      "a",
      "_",
    ]);
    expect(resetState.configMap[model.name].optionValues).toEqual(
      CELLPOSE_INIT_CONFIG.optionValues,
    );
  });
});

/*
 * These cover what project persistence added to the slice.
 *
 * The `modelLoaded` cases are the load-bearing ones: it used to reseed the
 * channel selection unconditionally, which meant a mapping restored from a
 * saved project was wiped the instant its model was loaded — the only moment
 * the mapping became visible at all. It now reseeds only when what is there
 * cannot be used.
 */
describe("segmenterSlice persistence support", () => {
  it("builds a config for every model name it is given", () => {
    const map = createModelConfigMap(MODELS);

    expect(Object.keys(map).sort()).toEqual([...MODELS].sort());
    expect(map["Cellpose-SAM"]).toEqual(getInitialModelConfig("Cellpose-SAM"));
  });

  it("keeps a restored channel selection when the model loads", () => {
    const restored = reducer(
      getInitialState(),
      actions.setSegmenter({
        segmenter: {
          loadedModel: undefined,
          configMap: {
            ...createModelConfigMap(MODELS),
            "Cellpose-SAM": {
              ...CELLPOSE_INIT_CONFIG,
              channelSelection: ["c", "a"],
            },
          },
        },
      }),
    );

    const state = reducer(
      restored,
      actions.modelLoaded({ model, availableChannelIds: ["a", "b", "c"] }),
    );

    expect(state.configMap[model.name].channelSelection).toEqual(["c", "a"]);
  });

  it("reseeds when a restored selection names a channel the image lacks", () => {
    const restored = reducer(
      getInitialState(),
      actions.setSegmenter({
        segmenter: {
          loadedModel: undefined,
          configMap: {
            ...createModelConfigMap(MODELS),
            "Cellpose-SAM": {
              ...CELLPOSE_INIT_CONFIG,
              channelSelection: ["a", "gone"],
            },
          },
        },
      }),
    );

    const state = reducer(
      restored,
      actions.modelLoaded({ model, availableChannelIds: ["a", "b", "c"] }),
    );

    expect(state.configMap[model.name].channelSelection).toEqual(["a", "b"]);
  });

  it("replaces the whole slice on setSegmenter", () => {
    const configMap = createModelConfigMap(MODELS);
    configMap.StardistVHE = {
      ...configMap.StardistVHE,
      optionValues: { probThresh: 0.7 },
    };

    const state = reducer(
      getInitialState(),
      actions.setSegmenter({
        segmenter: { loadedModel: undefined, configMap },
      }),
    );

    expect(state.configMap.StardistVHE.optionValues).toEqual({
      probThresh: 0.7,
    });
    expect(state.loadedModel).toBeUndefined();
  });
});
