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
      name: image.name,
      id: image.id,
      planes: image.shape.planes,
      height: image.shape.height,
      width: image.shape.width,
      channels: image.shape.channels,
      data: image.data.arraySync(),
      bitDepth: image.bitDepth,
      colors: {
        ...image.colors,
        color: image.colors.color.arraySync() as [number, number, number][],
      },
      partition: image.partition,
      categoryId: image.categoryId,
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
