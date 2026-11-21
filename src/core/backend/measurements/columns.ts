import { INTENSITY_MEASUREMENTS, OBJECT_FEATURES } from "core/entities";

import { BackendError } from "../errors";

import type { IntensityMeasurement, ObjectFeature } from "core/entities";

/*
 * How a measurement table names its columns, shared with the engine
 * (`piximi_schema.measurements`): a shape feature of an object, or a
 * statistic of the pixels in the channel of a meta (under the object's
 * mask, or an image's whole active-plane channel).
 */
export type MeasurementColumn =
  | { kind: "feature"; feature: ObjectFeature }
  | {
      kind: "intensity";
      measurement: IntensityMeasurement;
      channelMetaId: string;
    };

const FEATURE = "feature:";
const INTENSITY = "intensity:";

export const featureColumn = (feature: ObjectFeature): string =>
  `${FEATURE}${feature}`;

export const intensityColumn = (
  measurement: IntensityMeasurement,
  channelMetaId: string,
): string => `${INTENSITY}${measurement}:${channelMetaId}`;

/* Throws `NOT_SUPPORTED` for a key no backend understands. */
export const parseMeasurementColumn = (key: string): MeasurementColumn => {
  if (key.startsWith(FEATURE)) {
    const feature = key.slice(FEATURE.length);
    if ((OBJECT_FEATURES as readonly string[]).includes(feature)) {
      return { kind: "feature", feature: feature as ObjectFeature };
    }
  } else if (key.startsWith(INTENSITY)) {
    const rest = key.slice(INTENSITY.length);
    const colon = rest.indexOf(":");
    const measurement = colon === -1 ? rest : rest.slice(0, colon);
    const channelMetaId = colon === -1 ? "" : rest.slice(colon + 1);
    if (
      channelMetaId &&
      (INTENSITY_MEASUREMENTS as readonly string[]).includes(measurement)
    ) {
      return {
        kind: "intensity",
        measurement: measurement as IntensityMeasurement,
        channelMetaId,
      };
    }
  }
  throw new BackendError(
    "NOT_SUPPORTED",
    `Unknown measurement column "${key}"`,
  );
};
