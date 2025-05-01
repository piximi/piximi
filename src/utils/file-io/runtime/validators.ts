import { toError } from "./helpers";
import { getOrElseW } from "fp-ts/Either";
import {
  SerializedCOCOFileRType,
  SerializedModelMetadataRType,
} from "./runtimeTypes";
import { SerializedFileRType } from "./runtimeTypes";

export enum ProjectFileType {
  COCO,
  PIXIMI,
}

export const validateFileType = (
  encodedFileContents: string,
  projectType: ProjectFileType = ProjectFileType.PIXIMI,
) => {
  const annotations = JSON.parse(encodedFileContents);
  switch (projectType) {
    case ProjectFileType.PIXIMI:
      return getOrElseW(toError)(SerializedFileRType.decode(annotations));
    case ProjectFileType.COCO:
      return getOrElseW(toError)(SerializedCOCOFileRType.decode(annotations));
    default:
      throw new Error("Unrecognized project type", projectType);
  }
};

export const validateModelMetadata = (encodedFileContents: string) => {
  const metadata = JSON.parse(encodedFileContents);
  return getOrElseW(toError)(SerializedModelMetadataRType.decode(metadata));
};
