import { AnnotationType } from "types/AnnotationType";
import { Category } from "types/Category";
import { ImageType, ShadowImageType } from "types/ImageType";
import { ImageViewer } from "types/ImageViewer";
import { Project } from "types/Project";

// TODO: image_data
import { _SerializedFileType } from "format_convertor/types";

export const allSerializedAnnotationsSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): Array<_SerializedFileType> => {
  if (!imageViewer.images.length) return [];

  // @ts-ignore TODO: image_data
  return imageViewer.images.map((shadowImage: ShadowImageType) => {
    const image = shadowImage as ImageType;

    const columns = {
      imageChannels: image.shape.channels,
      imageColors: image.colors,
      // @ts-ignore TODO: image_data
      // imageData: image.originalSrc,
      imageSrc: image.src,
      imageFilename: image.name,
      imageHeight: image.shape.height,
      imageId: image.id,
      imagePlanes: image.shape.planes,
      imageWidth: image.shape.width,
    };

    const serializedAnnotations = image.annotations.map(
      (annotation: AnnotationType) => {
        const index = project.annotationCategories.findIndex(
          (category: Category) => {
            return category.id === annotation.categoryId;
          }
        );

        const category = project.annotationCategories[index];

        return {
          annotationBoundingBoxHeight: annotation.boundingBox[3],
          annotationBoundingBoxWidth: annotation.boundingBox[2],
          annotationBoundingBoxX: annotation.boundingBox[0],
          annotationBoundingBoxY: annotation.boundingBox[1],
          annotationCategoryColor: category.color,
          annotationCategoryId: category.id,
          annotationCategoryName: category.name,
          annotationId: annotation.id,
          annotationMask: annotation.mask.join(" "),
          annotationPlane: annotation.plane,
        };
      }
    );

    return { ...columns, annotations: serializedAnnotations };
  });
};
