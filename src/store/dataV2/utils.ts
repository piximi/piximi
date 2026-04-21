import { generateUUID } from "store/data/utils";
import { AnnotationCategory, ImageCategory, Category, Kind } from "./types";
import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "store/data/constants";

export const generateUnknownImageCategory = () => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: ImageCategory = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    type: "image",
    isUnknown: true,
  };
  return unknownCategory;
};
export const generateUnknownAnnotationCategory = (kindId: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: AnnotationCategory = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
    type: "annotation",
    kindId,
    isUnknown: true,
  };
  return unknownCategory;
};

export const generateCategory = (
  name: string,
  color: string,
  spec: { type: "image" } | { type: "annotation"; kindId: string },
) => {
  const id = generateUUID();
  return {
    name,
    id,
    color,
    isUnknown: false,
    ...spec,
  } as Category;
};

export const generateKind = (
  kindName: string,
  useUUID?: boolean,
): { kind: Kind; unknownCategory: AnnotationCategory } => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = generateUnknownAnnotationCategory(kindId);
  const kind: Kind = {
    id: kindId,
    name: kindName,
    unknownCategoryId: unknownCategory.id,
  };
  return { kind, unknownCategory };
};
