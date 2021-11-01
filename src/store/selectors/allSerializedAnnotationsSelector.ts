import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";
import { Category } from "../../types/Category";
import { ImageViewerImage } from "../../types/ImageViewerImage";
import { SerializedFileType } from "../../types/SerializedFileType";

export const allSerializedAnnotationsSelector = (
  imageViewer: ImageViewer
): Array<SerializedFileType> => {
  if (!imageViewer.images.length) return [];

  return imageViewer.images.map((image: ImageViewerImage) => {
    const columns = {
      imageChannels: image.shape.channels,
      imageChecksum: "",
      imageData: image.originalSrc,
      imageFilename: image.name,
      imageFrames: image.shape.frames,
      imageHeight: image.shape.height,
      imageId: image.id,
      imagePlanes: image.shape.planes,
      imageWidth: image.shape.width,
    };

    const serializedAnnotations = image.annotations.map(
      (annotation: AnnotationType) => {
        const index = imageViewer.categories.findIndex((category: Category) => {
          return category.id === annotation.categoryId;
        });

        const category = imageViewer.categories[index];

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
        };
      }
    );

    return { ...columns, annotations: serializedAnnotations };
  });
};
