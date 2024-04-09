import { deserializeCOCOFile_v2 } from "./v2/deserializeCOCO_v2";
import { SerializedCOCOFileType } from "../types";
import { Kind, NewCategory, NewImageType } from "store/data/types";

export const deserializeCOCOFile = async (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<NewImageType>,
  existingCategories: Array<NewCategory>,
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
