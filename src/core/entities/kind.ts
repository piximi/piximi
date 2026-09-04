import {
  generateUnknownAnnotationCategory,
  type AnnotationCategory,
  type ExtendedAnnotationCategory,
} from "./category";
import { generateUUID } from "./identity";

export type Kind = {
  id: string;
  name: string;
  unknownCategoryId: string;
};
export type ExtendedKind = Kind & { cats: Array<ExtendedAnnotationCategory> };
export type ExtendedKindEntities = Record<string, ExtendedKind>;

export const generateKind = (
  kindName: string,
): { kind: Kind; unknownCategory: AnnotationCategory } => {
  const kindId = generateUUID();
  const unknownCategory = generateUnknownAnnotationCategory(kindId);
  const kind: Kind = {
    id: kindId,
    name: kindName,
    unknownCategoryId: unknownCategory.id,
  };
  return { kind, unknownCategory };
};
