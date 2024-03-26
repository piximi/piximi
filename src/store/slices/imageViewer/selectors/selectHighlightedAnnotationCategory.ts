import { ImageViewer } from "types";

export const selectHighligtedAnnotationCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.highlightedCategory;
};

export const selectHighligtedIVCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.highlightedCategory;
};
