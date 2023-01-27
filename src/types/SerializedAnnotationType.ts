import * as T from "io-ts";
import { SerializedAnnotationRType } from "./runtime";

export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRType
>;
