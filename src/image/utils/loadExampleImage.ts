import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
} from "image/utils/imageHelper";

import { deserializeAnnotations } from "utils/annotator";

import { Category, SerializedFileType } from "types";

export const loadExampleImage = async (
  imagePath: string,
  serializedAnnotations: SerializedFileType,
  imageName?: string
) => {
  const imageFile = await fileFromPath(imagePath);
  const imageStack = await loadImageFileAsStack(imageFile);
  const image = await convertToImage(
    imageStack,
    imageName ? imageName : imageFile.name,
    undefined,
    1,
    3
  );

  const deserializedAnnotations = deserializeAnnotations(
    serializedAnnotations.annotations
  );

  image.annotations.push(...deserializedAnnotations);

  const categories = serializedAnnotations.categories as Category[];

  return { image, categories };
};
