import { HistoryStateType } from "../../types/HistoryStateType";
import { ImageType } from "../../types/ImageType";

export const imageOriginalSrcSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  if (!state.present.images.length) return;

  const image = state.present.images.find((image: ImageType) => {
    return image.id === state.present.activeImageId;
  });

  if (!image) return;

  return image.originalSrc;
};
