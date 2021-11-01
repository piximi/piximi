import { ImageViewer } from "../../types/ImageViewer";
export const annotatingSelector = (imageViewer: ImageViewer): boolean => {
  return imageViewer.annotating;
};
