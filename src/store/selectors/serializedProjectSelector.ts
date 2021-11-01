import { Project } from "../../types/Project";
import { Image } from "../../types/Image";
import { SerializedProjectType } from "../../types/SerializedProjectType";

export const serializedProjectSelector = ({
  project,
}: {
  project: Project;
}): SerializedProjectType => {
  const serializedImages = project.images.map((image: Image) => {
    const categoryId = image.categoryId
      ? image.categoryId
      : "00000000-0000-0000-0000-000000000000";

    return {
      imageCategoryId: categoryId,
      imageChannels: image.shape.channels,
      imageChecksum: "",
      imageData: image.originalSrc,
      imageFilename: image.name,
      imageFrames: image.shape.frames,
      imageHeight: image.shape.height,
      imageId: image.id,
      imagePlanes: image.shape.planes,
      imageWidth: image.shape.width,
      annotations: [],
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
