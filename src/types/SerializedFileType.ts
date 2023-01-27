import * as T from "io-ts";
import { SerializedFileRType } from "./runtime";

export type SerializedFileType = T.TypeOf<typeof SerializedFileRType>;
