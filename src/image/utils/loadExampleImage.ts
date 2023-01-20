import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
} from "image/utils/imageHelper";
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

  for (const annotation of serializedAnnotations.annotations) {
    image.annotations.push({
      id: annotation.id,
      mask: annotation.mask.split(" ").map((e) => Number(e)),
      plane: annotation.plane,
      boundingBox: annotation.boundingBox as [number, number, number, number],
      categoryId: annotation.categoryId,
    });
  }

  const categories = serializedAnnotations.categories as Category[];

  return { image, categories };
};
