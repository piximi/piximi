import { v4 as uuidv4 } from "uuid";

import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_NAME,
  UNKNOWN_KIND_CATEGORY_ID,
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_ID,
} from "./constants";

import type { AnnotationCategory, Category, Kind } from "./types";

const RESERVED_IDS = new Set([
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_ID,
  UNKNOWN_KIND_CATEGORY_ID,
]);
function* _uuidStream(definesUnknown: boolean) {
  const flag = definesUnknown ? "0" : "1";
  while (true) yield flag + uuidv4().slice(1);
}
/*
 * Generates a new UUID whilce preventing collision with predefined IDs
 * Though chances of collision are astronamically small without the guard,
 * better safe than sorry!
 */
export const generateUUID = (options?: { definesUnknown: boolean }) => {
  for (const id of _uuidStream(options?.definesUnknown ?? false)) {
    if (!RESERVED_IDS.has(id)) return id;
  }
  /*
  TypeScript doesn't know the generator is infinite, so it assumes
  for...of could end without hitting return, resulting in the return
  type of the function being `string | undefined`. The idiomatic fix 
  is an unreachable throw after the loop
  */
  throw new Error("unreachable");
};
const generateUnknownAnnotationCategory = (kindId: string) => {
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
