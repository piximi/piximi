import semver from "semver";
import { v01_deserializePiximiAnnotations } from "./v01/v01_deserializePiximiAnnotations";
import { v02_deserializePiximiAnnotations } from "./v02/v02_deserializePiximiAnnotations";
import { v01_02_convertAnnotationsWithExistingProject } from "utils/file-io/converters/v01_02_convertAnnotationsWithExistingProject";
import { logger } from "utils/logUtils";
import {
  SerializedFileType,
  SerializedFileTypeV02,
  SerializedFileTypeV12,
} from "../types";
import {
  Kind,
  Category,
  ImageMetadata,
  AnnotationObject,
} from "store/data/types";
import { v02_v12_convertAnnotation } from "../converters/v02_v12_convertAnnotations";
import { v12_deserializePiximiAnnotations } from "./v120/v12_deserializePiximiAnnotations";

export const deserializePiximiAnnotations = async (
  serializedAnnotations:
    | SerializedFileTypeV12
    | SerializedFileTypeV02
    | SerializedFileType,
  existingImages: Record<string, ImageMetadata>,
  existingCategories: Record<string, Category>,
  existingKinds: Record<string, Kind>,
) => {
  if (!("version" in serializedAnnotations)) {
    // pre 0.2.0
    const { annotations, newCategories } = v01_deserializePiximiAnnotations(
      serializedAnnotations as SerializedFileType,
      Object.values(existingImages),
      Object.values(existingCategories),
    );
    const convertedData = await v01_02_convertAnnotationsWithExistingProject(
      existingImages,
      existingKinds,
      annotations,
      newCategories,
    );
    const tsAnnotations = v02_v12_convertAnnotation(
      convertedData.newAnnotations,
    );
    return {
      ...convertedData,
      newAnnotations: tsAnnotations as AnnotationObject[],
    };
  }
  if (semver.gte(serializedAnnotations.version, "0.2.0")) {
    const { annotations, newCategories, newKinds } =
      await v02_deserializePiximiAnnotations(
        serializedAnnotations as SerializedFileTypeV02,
        Object.values(existingImages),
        Object.values(existingCategories),
        Object.values(existingKinds),
      );
    const tsAnnotations = v02_v12_convertAnnotation(annotations);
    return {
      newAnnotations: tsAnnotations as AnnotationObject[],
      newCategories,
      newKinds,
    };
  }
  if (semver.gte(serializedAnnotations.version, "1.2.0")) {
    const { annotations, newCategories, newKinds } =
      await v12_deserializePiximiAnnotations(
        serializedAnnotations as SerializedFileTypeV12,
        Object.values(existingImages),
        Object.values(existingCategories),
        Object.values(existingKinds),
      );
    return {
      newAnnotations: annotations as AnnotationObject[],
      newCategories,
      newKinds,
    };
  } else {
    logger(`Unrecognized Piximi version: ${serializedAnnotations.version}`);
    return { newAnnotations: [], newCategories: [], newKinds: [] };
  }
};
