import * as T from "io-ts";
import { SerializedImageRType } from "./runtime";

export type SerializedAnnotatorImageType = T.TypeOf<
  typeof SerializedImageRType
>;
