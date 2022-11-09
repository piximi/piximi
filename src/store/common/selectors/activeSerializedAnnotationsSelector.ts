import { Annotator } from "types/Annotator";
import { encodedAnnotationType } from "types/AnnotationType";
import { Category } from "types/Category";
import { ImageType, ShadowImageType } from "types/ImageType";
import { SerializedFileType } from "types/SerializedFileType";
import { SerializedAnnotationType } from "types/SerializedAnnotationType";
import { Project } from "types/Project";

export const activeSerializedAnnotationsSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}): SerializedFileType | undefined => {
  if (!annotator.images.length) return undefined;

  /*
    Find full image in project slice, else if not there
    full image is in annotator slice, return from there
  */
  const image =
    project.images.find((image: ImageType) => {
      return image.id === annotator.activeImageId;
    }) ||
    (annotator.images.find((image: ShadowImageType) => {
      return image.id === annotator.activeImageId;
    }) as ImageType);

  if (!image) return undefined;

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

  const serializedAnnotations: Array<SerializedAnnotationType> =
    image.annotations.map((annotation: encodedAnnotationType) => {
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
    });

  return { ...columns, annotations: serializedAnnotations };
};
