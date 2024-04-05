import * as T from "io-ts";
import { SerializedFileRType, SerializedFileRTypeV2 } from "./runtime";

export type SerializedFileType = T.TypeOf<typeof SerializedFileRType>;
export type SerializedFileTypeV2 = T.TypeOf<typeof SerializedFileRTypeV2>;
