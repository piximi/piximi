import { ImageViewer } from "../../types/ImageViewer";
export const annotatingSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): boolean => {
  return imageViewer.annotating;
};
