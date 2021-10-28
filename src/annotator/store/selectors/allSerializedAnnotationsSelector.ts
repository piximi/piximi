import { HistoryStateType } from "../../types/HistoryStateType";
import { AnnotationType } from "../../types/AnnotationType";
import { CategoryType } from "../../types/CategoryType";
import { ImageType } from "../../types/ImageType";
import { SerializedFileType } from "../../types/SerializedFileType";

export const allSerializedAnnotationsSelector = ({
  state,
}: {
  state: HistoryStateType;
}): Array<SerializedFileType> => {
  if (!state.present.images.length) return [];

  return state.present.images.map((image: ImageType) => {
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
        const index = state.present.categories.findIndex(
          (category: CategoryType) => {
            return category.id === annotation.categoryId;
          }
        );

        const category = state.present.categories[index];

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
