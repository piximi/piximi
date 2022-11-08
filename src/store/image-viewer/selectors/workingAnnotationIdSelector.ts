import { ImageViewer } from "types";
export const workingAnnotationIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  if (!imageViewer.workingAnnotation) return undefined;
  else return imageViewer.workingAnnotation.id;
};
