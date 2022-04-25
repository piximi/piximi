import { AnnotationType } from "../../types/AnnotationType";
import { Category } from "../../types/Category";
import { ImageType, ShadowImageType } from "../../types/ImageType";
import { SerializedFileType } from "../../types/SerializedFileType";
import { ImageViewer } from "../../types/ImageViewer";
import { Project } from "types/Project";

export const allSerializedAnnotationsSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): Array<SerializedFileType> => {
  if (!imageViewer.images.length) return [];

  return imageViewer.images.map((shadowImage: ShadowImageType) => {
    /*
      get full images from project by id if they exist there,
      else get full image from imageViewer
    */
    const image =
      project.images.find((im: ImageType) => im.id === shadowImage.id) ||
      (shadowImage as ImageType);

    const columns = {
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
          annotationPlane: annotation.plane,
        };
      }
    );

    return { ...columns, annotations: serializedAnnotations };
  });
};
