import { Group } from "zarr";
import { tensor2d } from "@tensorflow/tfjs";
import { getDatasetSelection } from "../../../zarr/zarrUtils";
import { Colors } from "utils/types";

export const deserializeColorsGroup = async (
  colorsGroup: Group,
): Promise<Colors> => {
  const colorsDataset = await getDatasetSelection(colorsGroup, "color", [null]);
  const numChannels = colorsDataset.shape[0];
  const colors = colorsDataset.data as Float32Array;
  const rangeMaxs = await getDatasetSelection(colorsGroup, "range_max", [
    null,
  ]).then((ra) => ra.data as Float32Array);
  const rangeMins = await getDatasetSelection(colorsGroup, "range_min", [
    null,
  ]).then((ra) => ra.data as Float32Array);
  const visibilities = await getDatasetSelection(colorsGroup, "visible_B", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  if (
    rangeMaxs.length !== numChannels ||
    rangeMins.length !== numChannels ||
    visibilities.length !== numChannels
  ) {
    throw Error(
      `Expected colors group "${colorsGroup.path}" to have "${numChannels}" channels, range and visibility`,
    );
  }

  const range: Colors["range"] = {};
  const visible: Colors["visible"] = {};
  for (let i = 0; i < numChannels; i++) {
    range[i] = [rangeMins[i], rangeMaxs[i]];
    visible[i] = Boolean(visibilities[i]);
  }

  return {
    range,
    visible,
    color: tensor2d(colors, [numChannels, 3], "float32"),
  };
};
