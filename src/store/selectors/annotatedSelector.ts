import { ImageViewer } from "../../types/ImageViewer";
export const annotatedSelector = (imageViewer: ImageViewer): boolean => {
  return imageViewer.annotated;
};
