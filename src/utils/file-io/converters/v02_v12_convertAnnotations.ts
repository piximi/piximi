import { AnnotationObject } from "store/data/types";
import { V02AnnotationObject } from "../types";

export const v02_v12_convertAnnotation = (
  v02Annotations: V02AnnotationObject[],
): AnnotationObject[] => {
  return v02Annotations.map((ann) => ({
    ...ann,
    plane: ann.activePlane,
    timepoint: "0",
  }));
};
