import { Project } from "../../types/Project";
import { Image } from "../../types/Image";
import { SerializedProjectType } from "../../types/SerializedProjectType";
import { UNKNOWN_CATEGORY_ID } from "../../types/Category";

export const serializedProjectSelector = ({
  project,
}: {
  project: Project;
}): SerializedProjectType => {
  const serializedImages = project.images.map((image: Image) => {
    const categoryId = image.categoryId
      ? image.categoryId
      : UNKNOWN_CATEGORY_ID;

    return {
      imageCategoryId: categoryId,
      imageChannels: image.shape.channels,
      imageColors: image.colors,
      imageData: image.originalSrc,
      imageSrc: image.src,
      imageFilename: image.name,
      imageFrames: image.shape.frames,
      imageHeight: image.shape.height,
      imageId: image.id,
      imagePlanes: image.shape.planes,
      imageWidth: image.shape.width,
      imagePartition: image.partition,
      annotations: image.annotations,
    };
  });

  const categories = project.categories;
  const name = project.name;

  return {
    serializedImages: serializedImages,
    categories: categories,
    name: name,
  };
};
