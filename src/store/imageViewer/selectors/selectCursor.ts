import { ImageViewerStore } from "types";
export const selectCursor = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string => {
  return imageViewer.cursor;
};
