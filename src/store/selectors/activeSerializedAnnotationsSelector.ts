import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";
import { Category } from "../../types/Category";
import { Image } from "../../types/Image";
import { SerializedFileType } from "../../types/SerializedFileType";
import { SerializedAnnotationType } from "../../types/SerializedAnnotationType";

export const activeSerializedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): SerializedFileType | undefined => {
  if (!imageViewer.images.length) return undefined;

  const image = imageViewer.images.find((image: Image) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return undefined;

  const columns = {
    imageChannels: image.shape.channels,
    imageChecksum: "",
    imageColors: image.colors,
    imageData: image.originalSrc,
    imageSrc: image.src,
    imageFilename: image.name,
    imageFrames: image.shape.frames,
    imageHeight: image.shape.height,
    imageId: image.id,
    imagePlanes: image.shape.planes,
    imageWidth: image.shape.width,
  };

  const serializedAnnotations: Array<SerializedAnnotationType> =
    image.annotations.map((annotation: AnnotationType) => {
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
        annotationPlane: annotation.plane,
      };
    });

  return { ...columns, annotations: serializedAnnotations };
};
