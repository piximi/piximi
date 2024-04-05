import { SerializedFileType, SerializedFileTypeV2 } from "types";
import { Kind, NewCategory } from "types/Category";
import { NewImageType } from "types/ThingType";
import { deserializePiximiAnnotations_v1 } from "./v1/deserializePiximiAnnotations_v1";
import { deserializePiximiAnnotations_v2 } from "./v2/deserializePiximiAnnotations_v2";
import { convertAnnotationsWithExistingProject_v1_2 } from "utils/converters/dataConverter_v1v2";
import { logger } from "utils/common/logger";

export const deserializePiximiAnnotations = async (
  serializedAnnotations: SerializedFileTypeV2 | SerializedFileType,
  existingImages: Record<string, NewImageType>,
  existingCategories: Record<string, NewCategory>,
  existingKinds: Record<string, Kind>
) => {
  switch (serializedAnnotations.version) {
    case "0.1.0": {
      const { annotations, newCategories } = deserializePiximiAnnotations_v1(
        serializedAnnotations as SerializedFileType,
        Object.values(existingImages),
        Object.values(existingCategories)
      );
      const convertedData = convertAnnotationsWithExistingProject_v1_2(
        existingImages,
        existingKinds,
        annotations,
        newCategories
      );
      return convertedData;
    }
    case "0.2.0": {
      const { annotations, newCategories, newKinds } =
        await deserializePiximiAnnotations_v2(
          serializedAnnotations as SerializedFileTypeV2,
          Object.values(existingImages),
          Object.values(existingCategories),
          Object.values(existingKinds)
        );
      return { newAnnotations: annotations, newCategories, newKinds };
    }
    default:
      logger(`Unrecognized Piximi version: ${serializedAnnotations.version}`);
      return { newAnnotations: [], newCategories: [], newKinds: [] };
  }
};
