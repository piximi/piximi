import { ImageViewer } from "../../types/ImageViewer";
export const languageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.language;
};
