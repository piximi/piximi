import { SerializedCOCOFileType } from "types";
import { Kind, NewCategory } from "types/Category";
import { NewImageType } from "types/ThingType";
import { deserializeCOCOFile_v2 } from "./v2/deserializeCOCO_v2";

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
