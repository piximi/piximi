import { AnnotationType } from "./AnnotationType";

export type AnnotationsEntityType = Record<string, AnnotationType>;
export type stagedAnnotationEntityType = Record<
  string,
  { id: string } & Partial<AnnotationType>
>;
