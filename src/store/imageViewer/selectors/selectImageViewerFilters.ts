import { ImageViewerState } from "store/types";

export const selectImageViewerFilters = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.filters;
};
