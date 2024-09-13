import { deserializeCOCOFile_v02 } from "./v02/deserializeCOCO_v02";
import { SerializedCOCOFileType } from "../types";
import { Kind, Category, ImageObject } from "store/data/types";

export const deserializeCOCOFile = async (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<ImageObject>,
  existingCategories: Array<Category>,
  existingKinds: Array<Kind>,
  availableColors: Array<string> = []
) => {
  return deserializeCOCOFile_v02(
    cocoFile,
    existingImages,
    existingCategories,
    existingKinds,
    availableColors
  );
};
