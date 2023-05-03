import { ImageViewerStore } from "types";
export const pointerSelectionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
} => {
  return imageViewer.pointerSelection;
};
