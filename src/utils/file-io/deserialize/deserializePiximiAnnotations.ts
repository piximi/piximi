import semver from "semver";
import { v01_deserializePiximiAnnotations } from "./v01/v01_deserializePiximiAnnotations";
import { v02_deserializePiximiAnnotations } from "./v02/v02_deserializePiximiAnnotations";
import { v01_02_convertAnnotationsWithExistingProject } from "utils/file-io/converters/v01_02_convertAnnotationsWithExistingProject";
import { logger } from "utils/logUtils";
import {
  SerializedFileType,
  SerializedFileTypeV02,
  SerializedFileTypeV12,
  V01Category,
  V01ImageObject,
  V02Category,
  V02ImageObject,
  V02Kind,
  V12Category,
  V12Kind,
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
  existingImages:
    | Record<string, V01ImageObject>
    | Record<string, V02ImageObject>
    | Record<string, ImageMetadata>,
  existingCategories:
    | Record<string, V01Category>
    | Record<string, V02Category>
    | Record<string, Category>,
  existingKinds: Record<string, V02Kind> | Record<string, Kind>,
) => {
  if (!("version" in serializedAnnotations)) {
    // pre 0.2.0
    const { annotations, newCategories } = v01_deserializePiximiAnnotations(
      serializedAnnotations as SerializedFileType,
      Object.values(existingImages),
      Object.values(existingCategories),
    );
    const convertedData = await v01_02_convertAnnotationsWithExistingProject(
      existingImages as Record<string, V01ImageObject>,
      existingKinds as Record<string, V02Kind>,
      annotations,
      newCategories,
    );
    const v12Annotations = v02_v12_convertAnnotation(
      convertedData.newAnnotations,
    );
    return {
      ...convertedData,
      newAnnotations: v12Annotations as AnnotationObject[],
    };
  }
  if (semver.gte(serializedAnnotations.version, "0.2.0")) {
    const { annotations, newCategories, newKinds } =
      await v02_deserializePiximiAnnotations(
        serializedAnnotations as SerializedFileTypeV02,
        Object.values(existingImages) as V02ImageObject[],
        Object.values(existingCategories) as V02Category[],
        Object.values(existingKinds) as V02Kind[],
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
        Object.values(existingCategories) as V12Category[],
        Object.values(existingKinds) as V12Kind[],
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
