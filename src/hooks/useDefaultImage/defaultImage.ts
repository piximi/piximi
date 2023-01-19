import {
  fileFromPath,
  loadImageFileAsStack,
  convertToImage,
} from "image/utils/imageHelper";
import { Category } from "types";
import colorImage from "images/cell-painting.png";
import cellPaintingAnnotations from "./cell-painting.json";

export const loadDefaultImage = async () => {
  const imageFile = await fileFromPath(colorImage);
  const imageStack = await loadImageFileAsStack(imageFile);
  const image = await convertToImage(
    imageStack,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png",
    undefined,
    1,
    3
  );

  for (const annotation of cellPaintingAnnotations.annotations) {
    image.annotations.push({
      id: annotation.id,
      mask: annotation.mask.split(" ").map((e) => Number(e)),
      plane: annotation.plane,
      boundingBox: annotation.boundingBox as [number, number, number, number],
      categoryId: annotation.categoryId,
    });
  }

  const categories = cellPaintingAnnotations.categories as Category[];

  return { image, categories };
};
