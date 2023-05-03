import { ImageViewerStore } from "types";
export const cursorSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string => {
  return imageViewer.cursor;
};
