import * as T from "io-ts";
import { SerializedAnnotationType } from "./runtime";

export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationType
>;
