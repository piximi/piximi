import { deserializeCOCOFile_v2 } from "./v2/deserializeCOCO_v2";
import { SerializedCOCOFileType } from "../types";
import { Kind, Category, ImageObject } from "store/data/types";

export const deserializeCOCOFile = async (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<ImageObject>,
  existingCategories: Array<Category>,
  existingKinds: Array<Kind>,
  availableColors: Array<string> = []
) => {
  return deserializeCOCOFile_v2(
    cocoFile,
    existingImages,
    existingCategories,
    existingKinds,
    availableColors
  );
};
