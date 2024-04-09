import { ImageViewerState } from "store/types";

export const selectZoomSelection = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
  centerPoint: { x: number; y: number } | undefined;
} => {
  return imageViewer.zoomSelection;
};
