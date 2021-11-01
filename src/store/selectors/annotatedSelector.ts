import { ImageViewer } from "../../types/ImageViewer";
export const annotatedSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): boolean => {
  return imageViewer.annotated;
};
