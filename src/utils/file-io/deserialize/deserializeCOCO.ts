import { v02_deserializeCOCOFile } from "./v02/v02_deserializeCOCO";
import {
  SerializedCOCOFileType,
  V02Category,
  V02ImageObject,
  V02Kind,
} from "../types";

export const deserializeCOCOFile = async (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<V02ImageObject>,
  existingCategories: Array<V02Category>,
  existingKinds: Array<V02Kind>,
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
