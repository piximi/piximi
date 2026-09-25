import {
  CHANNEL_MODE_KEY,
  CHANNEL_MODE_LEGACY,
  CHANNEL_MODE_PASSTHROUGH,
} from "../../optionUtils";

import type { SegmentOptions } from "cellpose-js";

import type { SegmenterOptionSchema, SegmenterOptionValues } from "../../types";

/*
 * Cellpose-SAM inference knobs, mapped onto cellpose-js 0.6.0's `SegmentOptions`.
 *
 * The defaults here deliberately differ from the values this model shipped with
 * (`{ diameter: 30, chan: 0, chan2: 0 }`), which were carried over from the
 * legacy cloud Cellpose and are wrong for CPSAM on all three counts: they
 * force-rescale every image, they switch cellpose-js out of its passthrough
 * channel mode, and `chan: 0` then averages distinct markers into one grayscale
 * plane. See `cellpose-js/dist/preprocess/channels.d.ts`.
 */

/* `tile` is pinned: CPSAM's position embeddings are baked at 256. */
const TILE_SIZE = 256;

const GRAYSCALE_WARNING =
  "Averages the sent channels into one plane. Only correct when they are the " +
  "same signal (e.g. an RGB brightfield photo). Never use this for distinct " +
  "fluorescence markers.";

const LEGACY_ONLY = {
  key: CHANNEL_MODE_KEY,
  equals: CHANNEL_MODE_LEGACY,
} as const;

export const CELLPOSE_OPTION_SCHEMA: SegmenterOptionSchema = {
  groups: [
    {
      id: "segmentation",
      label: "Segmentation",
      fields: [
        {
          key: "diameter",
          label: "Cell diameter (px)",
          type: "number",
          optional: true,
          emptyLabel: "Auto",
          min: 5,
          max: 500,
          step: 1,
          control: "text",
          help:
            "Rescales the image so the median cell spans ~30 px, the size " +
            "Cellpose-SAM was trained on. Leave empty to segment at native " +
            "resolution.",
        },
        {
          key: "cellprobThreshold",
          label: "Cell probability threshold",
          type: "number",
          default: 0,
          min: -6,
          max: 6,
          step: 0.1,
          precision: 1,
          control: "slider",
          help: "Lower values yield more and larger masks; higher values fewer.",
        },
      ],
    },
    {
      id: "channels",
      label: "Channels",
      // Rendered alongside the channel picker, not in the generic panel.
      describesChannels: true,
      fields: [
        {
          key: CHANNEL_MODE_KEY,
          label: "Mode",
          type: "select",
          default: CHANNEL_MODE_PASSTHROUGH,
          choices: [
            {
              value: CHANNEL_MODE_PASSTHROUGH,
              label: "Pass through (recommended)",
            },
            { value: CHANNEL_MODE_LEGACY, label: "Legacy (chan / chan2)" },
          ],
          help:
            "Cellpose-SAM is channel-agnostic and normalizes each channel " +
            "independently, so passthrough suits it best. Legacy exposes the " +
            "Cellpose 1-3 primary/secondary mapping for parameter sets lifted " +
            "from an existing pipeline. " +
            GRAYSCALE_WARNING,
        },
        {
          key: "chan",
          label: "Primary",
          type: "channelIndex",
          default: 0,
          zeroLabel: "Grayscale (mean)",
          visibleWhen: LEGACY_ONLY,
          help: GRAYSCALE_WARNING,
        },
        {
          key: "chan2",
          label: "Secondary",
          type: "channelIndex",
          default: 0,
          zeroLabel: "None",
          visibleWhen: LEGACY_ONLY,
          help: "Optional nuclear channel.",
        },
      ],
    },
    {
      id: "dynamics",
      label: "Flow dynamics",
      fields: [
        {
          key: "resample",
          label: "Resample at source resolution",
          type: "boolean",
          default: false,
          advanced: true,
          help: "Only has an effect when a cell diameter is set.",
        },
        {
          key: "niter",
          label: "Flow iterations",
          type: "number",
          default: 200,
          min: 20,
          max: 2000,
          step: 10,
          control: "text",
          advanced: true,
        },
        {
          key: "maxSizeFraction",
          label: "Max mask size (fraction of image)",
          type: "number",
          default: 0.4,
          min: 0.05,
          max: 1,
          step: 0.05,
          precision: 2,
          control: "slider",
          advanced: true,
        },
      ],
    },
  ],
};

/*
 * True unless the user explicitly opted into the legacy chan/chan2 mapping.
 * Also gates channel truncation: passthrough only ever reads the first 3
 * channels, while legacy must keep them all so `chan = k` can reach any of them.
 */
export const isCellposePassthrough = (values: SegmenterOptionValues = {}) =>
  values[CHANNEL_MODE_KEY] !== CHANNEL_MODE_LEGACY;

/* Channels cellpose-js reads in passthrough mode (upstream's `x[..., :3]`). */
export const CELLPOSE_PASSTHROUGH_CHANNELS = 3;

export const toCellposeSegmentOptions = (
  values: SegmenterOptionValues = {},
): SegmentOptions => {
  const num = (key: string) => {
    const value = values[key];
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : undefined;
  };

  const diameter = num("diameter");
  const cellprobThreshold = num("cellprobThreshold");
  const niter = num("niter");
  const maxSizeFraction = num("maxSizeFraction");

  const dynamics = {
    ...(cellprobThreshold !== undefined && { cellprobThreshold }),
    ...(niter !== undefined && { niter }),
    ...(maxSizeFraction !== undefined && { maxSizeFraction }),
  };

  /*
   * chan/chan2 are OMITTED entirely in passthrough mode — including when stale
   * values linger from a previous stint in legacy mode. cellpose-js documents
   * "Setting either one switches to explicit selection"; if it tests with `in`
   * rather than `!== undefined`, even a `chan: undefined` property would force
   * legacy with chan=0, which is the exact defect being fixed here. Conditional
   * spread keeps the key literally absent, so either implementation is safe.
   */
  const legacyChannels = isCellposePassthrough(values)
    ? {}
    : { chan: num("chan") ?? 0, chan2: num("chan2") ?? 0 };

  return {
    tile: TILE_SIZE,
    ...(diameter !== undefined && { diameter }), // absent => native resolution
    ...(values.resample === true && { resample: true }),
    ...legacyChannels,
    ...(Object.keys(dynamics).length > 0 && { dynamics }),
  };
};
