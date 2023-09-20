import { ImageViewerStore } from "types";

export const selectHighligtedAnnotationCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.highlightedCategory;
};
