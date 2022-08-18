import { ImageViewer } from "types";
export const cursorSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string => {
  return imageViewer.cursor;
};
