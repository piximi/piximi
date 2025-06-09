import semver from "semver";
import { v01_deserializePiximiAnnotations } from "./v01/v01_deserializePiximiAnnotations";
import { v02_deserializePiximiAnnotations } from "./v02/v02_deserializePiximiAnnotations";
import { v01_02_convertAnnotationsWithExistingProject } from "utils/file-io/converters/v01_02_convertAnnotationsWithExistingProject";
import { logger } from "utils/logUtils";
import { SerializedFileType, SerializedFileTypeV02 } from "../types";
import { Kind, Category, ImageObject } from "store/data/types";

export const deserializePiximiAnnotations = async (
  serializedAnnotations: SerializedFileTypeV02 | SerializedFileType,
  existingImages: Record<string, ImageObject>,
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
    return convertedData;
  }
  if (semver.gte(serializedAnnotations.version, "0.2.0")) {
    const { annotations, newCategories, newKinds } =
      await v02_deserializePiximiAnnotations(
        serializedAnnotations as SerializedFileTypeV02,
        Object.values(existingImages),
        Object.values(existingCategories),
        Object.values(existingKinds),
      );
    return { newAnnotations: annotations, newCategories, newKinds };
  } else {
    logger(`Unrecognized Piximi version: ${serializedAnnotations.version}`);
    return { newAnnotations: [], newCategories: [], newKinds: [] };
  }
};
