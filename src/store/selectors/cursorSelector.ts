import { ImageViewer } from "../../types/ImageViewer";
export const cursorSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string => {
  return imageViewer.cursor;
};
