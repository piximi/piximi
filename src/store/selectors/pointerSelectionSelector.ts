import { ImageViewer } from "../../types/ImageViewer";
export const pointerSelectionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
} => {
  return imageViewer.pointerSelection;
};
