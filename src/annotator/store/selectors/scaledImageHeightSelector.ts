import { HistoryStateType } from "../../types/HistoryStateType";
import { ImageType } from "../../types/ImageType";

export const scaledImageHeightSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  if (!state.present.images.length) return;

  const image = state.present.images.filter((image: ImageType) => {
    return image.id === state.present.activeImageId;
  })[0];

  if (!image) return;

  return image.shape.height * state.present.stageScale;
};
