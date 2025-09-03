import { v02_deserializeCOCOFile } from "./v02/v02_deserializeCOCO";
import { SerializedCOCOFileType } from "../types";
import { Kind, Category, ImageMetadata } from "store/data/types";

export const deserializeCOCOFile = async (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<ImageMetadata>,
  existingCategories: Array<Category>,
  existingKinds: Array<Kind>,
  availableColors: Array<string> = [],
) => {
  return v02_deserializeCOCOFile(
    cocoFile,
    existingImages,
    existingCategories,
    existingKinds,
    availableColors,
  );
};
