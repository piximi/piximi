import { ImageViewer } from "types";
export const languageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.language;
};
