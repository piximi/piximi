import { HistoryStateType } from "../../types/HistoryStateType";
import { AnnotationType } from "../../types/AnnotationType";
import { ImageType } from "../../types/ImageType";

export const unselectedAnnotationsSelector = ({
  state,
}: {
  state: HistoryStateType;
}): Array<AnnotationType> => {
  if (!state.present.images.length) return [];

  const image = state.present.images.find((image: ImageType) => {
    return image.id === state.present.activeImageId;
  });

  if (!image) return [];

  const ids = state.present.selectedAnnotations.map(
    (annotation: AnnotationType) => {
      return annotation.id;
    }
  );

  return image.annotations.filter((annotation: AnnotationType) => {
    return !ids.includes(annotation.id);
  });
};
