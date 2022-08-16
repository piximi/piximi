import { ToolOptionsStateType, ZoomToolOptionsType } from "types";

export const zoomToolOptionsSelector = ({
  toolOptions,
}: {
  toolOptions: ToolOptionsStateType;
}): ZoomToolOptionsType => {
  return toolOptions.zoom;
};
