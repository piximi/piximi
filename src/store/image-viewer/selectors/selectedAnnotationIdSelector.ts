import { ImageViewer } from "types";
export const selectedAnnotationIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  if (!imageViewer.selectedAnnotation) return undefined;
  else return imageViewer.selectedAnnotation.id;
};
