import { Annotator } from "types";

export const zoomSelectionSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
  centerPoint: { x: number; y: number } | undefined;
} => {
  return annotator.zoomSelection;
};
