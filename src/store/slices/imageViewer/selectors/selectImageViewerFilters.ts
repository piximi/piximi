import { ImageViewer } from "types";

export const selectImageViewerFilters = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.filters;
};
