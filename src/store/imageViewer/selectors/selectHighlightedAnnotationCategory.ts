import { ImageViewer } from "types";

export const selectHighligtedAnnotationCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.highlightedCategory;
};
