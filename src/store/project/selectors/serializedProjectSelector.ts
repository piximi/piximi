import { Project } from "types/Project";
import { ImageType } from "types/ImageType";
import { SerializedProjectType } from "types/SerializedProjectType";

export const serializedProjectSelector = ({
  project,
}: {
  project: Project;
}): SerializedProjectType => {
  const serializedImages = project.images.map((image: ImageType) => {
    return {
      imageCategoryId: image.categoryId,
      imageChannels: image.shape.channels,
      imageColors: image.colors,
      // @ts-ignore TODO: image_data
      imageData: image.originalSrc,
      imageSrc: image.src, // TODO: keep this for larger saved projects, or delete it for slower load times
      imageFilename: image.name,
      imageHeight: image.shape.height,
      imageId: image.id,
      imagePlanes: image.shape.planes,
      imageWidth: image.shape.width,
      imagePartition: image.partition,
      annotations: image.annotations,
    };
  });

  return {
    serializedImages: serializedImages,
    categories: project.categories,
    annotationCategories: project.annotationCategories,
    name: project.name,
  };
};
