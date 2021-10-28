import { HistoryStateType } from "../../types/HistoryStateType";
import { ImageType } from "../../types/ImageType";

export const imageWidthSelector = ({ state }: { state: HistoryStateType }) => {
  if (!state.present.images.length || !state.present.activeImageId) return;

  const image = state.present.images.filter((image: ImageType) => {
    return image.id === state.present.activeImageId;
  })[0];

  return image.shape.width;
};
