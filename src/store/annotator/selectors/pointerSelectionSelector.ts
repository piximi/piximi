import { Annotator } from "types";
export const pointerSelectionSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
} => {
  return annotator.pointerSelection;
};
