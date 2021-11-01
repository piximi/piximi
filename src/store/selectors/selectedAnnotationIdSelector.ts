import { ImageViewer } from "../../types/ImageViewer";
export const selectedAnnotationIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  if (!imageViewer.selectedAnnotation) return undefined;
  else return imageViewer.selectedAnnotation.id;
};
