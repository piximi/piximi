import * as T from "io-ts";
import { getOrElseW } from "fp-ts/Either";
import { failure } from "io-ts/PathReporter";

const SerializedCategoryType = T.type({
  id: T.string,
  color: T.string, // 3 byte hex, eg "#a08cd2"
  name: T.string,
  visible: T.boolean,
});

export const SerializedAnnotationType = T.type({
  categoryId: T.string, // category id, matching id of a SerializedCategory
  id: T.string,
  mask: T.string, // e.g. "114 1 66 1 66 2 ..."
  plane: T.number,
  boundingBox: T.array(T.number), // [x1, y1, width, height]
});

export const SerializedFileType = T.type({
  categories: T.array(SerializedCategoryType),
  annotations: T.array(SerializedAnnotationType),
});

const toError = (errors: any) => {
  throw new Error(failure(errors).join("\n"));
};

export const validateFileType = (encodedFileContents: string) => {
  const annotations = JSON.parse(encodedFileContents);
  return getOrElseW(toError)(SerializedFileType.decode(annotations));
};
