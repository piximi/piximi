import { HistoryStateType } from "../../types/HistoryStateType";
import { ImageType } from "../../types/ImageType";

export const imagesSelector = ({
  state,
}: {
  state: HistoryStateType;
}): Array<ImageType> => {
  return state.present.images;
};
