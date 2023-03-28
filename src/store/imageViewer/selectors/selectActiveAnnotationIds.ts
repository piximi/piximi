import { ImageViewer } from "types";

export const selectActiveAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.activeAnnotationIds;
};

export const selectActiveAnnotationIdsCount = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.activeAnnotationIds.length;
};
