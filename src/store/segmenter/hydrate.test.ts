import { describe, expect, it } from "vitest";

import { hydrateSegmenterState } from "./hydrate";
import { getInitialState } from "./segmenterSlice";

import type { SerializedSegmenterState } from "core/file-io/project-saver/types";

/*
 * `hydrateSegmenterState` is the only thing standing between a project file and
 * redux, so these assertions are about what it refuses to trust. A file can be
 * older than the build opening it: it may name a model that has since been
 * retired, point at channels the project no longer has, or carry an option
 * value of a type the schema never produces. Each of those has to degrade to a
 * usable default rather than propagate, because the segmenter has no other
 * validation layer behind this one.
 */
describe("hydrateSegmenterState", () => {
  const available = ["ch-1", "ch-2", "ch-3"];
  const empty: SerializedSegmenterState = { loadedModel: null, configs: [] };

  it("yields the initial state when the file carried no configs", () => {
    // What every pre-v2 format converts to.
    expect(hydrateSegmenterState(empty, available)).toEqual(getInitialState());
  });

  it("never restores a loaded model, even when the file names one", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: "Cellpose-SAM",
      configs: [],
    };

    expect(hydrateSegmenterState(saved, available).loadedModel).toBeUndefined();
  });

  it("restores a channel selection whose ids all still exist", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: null,
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: ["ch-3", "ch-1"],
          optionValues: {},
          kindName: undefined,
        },
      ],
    };

    expect(
      hydrateSegmenterState(saved, available).configMap["Cellpose-SAM"]
        .channelSelection,
    ).toEqual(["ch-3", "ch-1"]);
  });

  it("clears a channel selection referencing an id the project lost", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: null,
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: ["ch-1", "ch-gone"],
          optionValues: {},
          kindName: undefined,
        },
      ],
    };

    expect(
      hydrateSegmenterState(saved, available).configMap["Cellpose-SAM"]
        .channelSelection,
    ).toEqual([]);
  });

  it("overlays saved option values onto the model's defaults", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: null,
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: [],
          optionValues: { diameter: 30 },
          kindName: undefined,
        },
      ],
    };

    const options = hydrateSegmenterState(saved, available).configMap[
      "Cellpose-SAM"
    ].optionValues;

    expect(options.diameter).toBe(30);
    // Untouched knobs stay unset so the schema default applies.
    expect("niter" in options).toBe(false);
  });

  it("preserves an option deliberately committed as undefined", () => {
    // Not the same as an absent key: it means "omit it, use the library default".
    const saved: SerializedSegmenterState = {
      loadedModel: null,
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: [],
          optionValues: { diameter: undefined },
          kindName: undefined,
        },
      ],
    };

    const options = hydrateSegmenterState(saved, available).configMap[
      "Cellpose-SAM"
    ].optionValues;

    expect("diameter" in options).toBe(true);
    expect(options.diameter).toBeUndefined();
  });

  it("drops an option value of a type no schema produces", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: null,
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: [],
          optionValues: {
            niter: { nested: true },
          } as never,
          kindName: undefined,
        },
      ],
    };

    expect(
      "niter" in
        hydrateSegmenterState(saved, available).configMap["Cellpose-SAM"]
          .optionValues,
    ).toBe(false);
  });

  it("skips a config naming a model this build no longer has", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: null,
      configs: [
        {
          model: "RetiredNet",
          channelSelection: ["ch-1"],
          optionValues: { whatever: 1 },
          kindName: undefined,
        },
      ],
    };

    expect(hydrateSegmenterState(saved, available)).toEqual(getInitialState());
  });

  it("keeps every model's config, not just the one that was loaded", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: "Cellpose-SAM",
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: ["ch-1"],
          optionValues: {},
          kindName: undefined,
        },
        {
          model: "StardistVHE",
          channelSelection: ["ch-2"],
          optionValues: {},
          kindName: undefined,
        },
      ],
    };

    const { configMap } = hydrateSegmenterState(saved, available);

    expect(configMap["Cellpose-SAM"].channelSelection).toEqual(["ch-1"]);
    expect(configMap.StardistVHE.channelSelection).toEqual(["ch-2"]);
  });

  it("restores every model at idle, whatever it was doing at save time", () => {
    const saved: SerializedSegmenterState = {
      loadedModel: "Cellpose-SAM",
      configs: [
        {
          model: "Cellpose-SAM",
          channelSelection: [],
          optionValues: {},
          kindName: undefined,
        },
      ],
    };

    expect(
      hydrateSegmenterState(saved, available).configMap["Cellpose-SAM"]
        .modelStatus,
    ).toBe("idle");
  });
});
