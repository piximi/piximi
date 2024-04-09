import { ImageViewerState } from "store/types";
export const selectCursor = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string => {
  return imageViewer.cursor;
};
