import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "utils/common/colorPalette";
import { RequireField } from "./utility/PartialBy";

export type Category = {
  color: string; // 3 byte hex, eg. "#a08cd2"
  id: string;
  name: string;
  visible: boolean;
  containing?: string[];
  kind?: string;
};

export type NewCategory = RequireField<Category, "containing" | "kind">;
export type Kind = {
  id: string;
  containing: string[];
  categories: string[];
  unknownCategoryId: string;
};

export enum CategoryType {
  ImageCategory,
  AnnotationCategory,
}

export const UNKNOWN_IMAGE_CATEGORY_ID: string =
  "00000000-0000-0000-0000-000000000000";
export const UNKNOWN_ANNOTATION_CATEGORY_ID: string =
  "00000000-0000-1111-0000-000000000000";
export const UNKNOWN_CATEGORY_NAME: string = "Unknown";

export const UNKNOWN_IMAGE_CATEGORY: Category = {
  color: UNKNOWN_IMAGE_CATEGORY_COLOR,
  id: UNKNOWN_IMAGE_CATEGORY_ID,
  name: "Unknown",
  visible: true,
  containing: [],
};

export const UNKNOWN_ANNOTATION_CATEGORY: Category = {
  color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  id: UNKNOWN_ANNOTATION_CATEGORY_ID,
  name: "Unknown",
  visible: true,
};
