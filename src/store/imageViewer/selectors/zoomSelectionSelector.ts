import { ImageViewer } from "types";

export const zoomSelectionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
  centerPoint: { x: number; y: number } | undefined;
} => {
  return imageViewer.zoomSelection;
};
