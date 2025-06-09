import { getAttr } from "utils/file-io/zarr/zarrUtils";
import { CropSchema } from "utils/models/enums";
import { CropOptions, FitOptions, RescaleOptions } from "utils/models/types";
import { Group } from "zarr";

// COMMON
export const deserializeFitOptionsGroup = async (
  fitOptionsGroup: Group,
): Promise<FitOptions> => {
  const epochs = (await getAttr(fitOptionsGroup, "epochs")) as number;
  const batchSize = (await getAttr(fitOptionsGroup, "batch_size")) as number;

  return {
    batchSize,
    epochs,
  };
};

export const deserializeCropOptionsGroup = async (
  cropOptionsGroup: Group,
): Promise<CropOptions> => {
  const cropSchema = (await getAttr(
    cropOptionsGroup,
    "crop_schema",
  )) as string as CropSchema;

  const numCrops = (await getAttr(cropOptionsGroup, "num_crops")) as number;

  return { cropSchema, numCrops };
};

export const deserializeRescaleOptionsGroup = async (
  rescaleOptionsGroup: Group,
): Promise<RescaleOptions> => {
  const centerRaw = (await getAttr(rescaleOptionsGroup, "center_B")) as number;
  const center = Boolean(centerRaw);
  const rescaleRaw = (await getAttr(
    rescaleOptionsGroup,
    "rescale_B",
  )) as number;
  const rescale = Boolean(rescaleRaw);

  return { center, rescale };
};
