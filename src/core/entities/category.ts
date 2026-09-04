import { generateUUID } from "./identity";
import { UNKNOWN_ANNOTATION_CATEGORY_COLOR, UNKNOWN_NAME } from "./unknown";

type BaseCategory = {
  id: string;
  color: string;
  name: string;
  isUnknown: boolean;
};
export type ImageCategory = BaseCategory & { type: "image" };

export type AnnotationCategory = BaseCategory & {
  type: "annotation";
  kindId: string;
};
export type ExtendedAnnotationCategory = AnnotationCategory & {
  labeldIds: Array<string>;
};
export type Category = ImageCategory | AnnotationCategory;
export type CategoryEntities = Record<string, Category>;

export const generateUnknownAnnotationCategory = (kindId: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: AnnotationCategory = {
    id: unknownCategoryId,
    name: UNKNOWN_NAME,
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
