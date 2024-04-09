import { ImageViewerState } from "store/types";

export const selectHighligtedAnnotationCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.highlightedCategory;
};

export const selectHighligtedIVCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.highlightedCategory;
};
