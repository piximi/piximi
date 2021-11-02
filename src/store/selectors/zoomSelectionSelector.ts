import { ImageViewer } from "../../types/ImageViewer";
export const zoomSelectionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
} => {
  return imageViewer.zoomSelection;
};
