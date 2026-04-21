import { generateUUID } from "store/data/utils";
import { Category, Kind } from "./types";
import { UNKNOWN_ANNOTATION_CATEGORY_COLOR } from "store/data/constants";

export const UNKNOWN_KIND_CATEGORY_ID = generateUUID({ definesUnknown: true });
export const UNKNOWN_KIND_ID = generateUUID({ definesUnknown: true });
export const UNKNOWN_KIND: Kind = {
  id: UNKNOWN_KIND_ID,
  name: "Unknown",
  unknownCategoryId: UNKNOWN_KIND_CATEGORY_ID,
};
export const UNKNOWN_KIND_CATEGORY: Category = {
  id: UNKNOWN_KIND_CATEGORY_ID,
  name: "Unknown",
  type: "annotation",
  kindId: UNKNOWN_KIND_ID,
  isUnknown: true,
  color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
};
