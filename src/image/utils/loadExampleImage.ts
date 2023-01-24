import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
} from "image/utils/imageHelper";
import {
  encodedAnnotationType,
  Category,
  SerializedAnnotationType,
  SerializedFileType,
} from "types";

export const deserializeAnnotations = (
  serializedAnnotations: Array<SerializedAnnotationType>
) => {
  const annotations: Array<encodedAnnotationType> = [];

  for (const annotation of serializedAnnotations) {
    annotations.push({
      id: annotation.id,
      mask: annotation.mask.split(" ").map((e) => Number(e)),
      plane: annotation.plane,
      boundingBox: annotation.boundingBox as [number, number, number, number],
      categoryId: annotation.categoryId,
    });
  }

  return annotations;
};

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
