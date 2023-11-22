import { ImageViewer } from "types";
export const selectCursor = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string => {
  return imageViewer.cursor;
};
