import { ZoomToolOptionsType } from "../../types/ZoomToolOptionsType";
import { ToolOptionsStateType } from "../../types/ToolOptionsStateType";

export const zoomToolOptionsSelector = ({
  toolOptions,
}: {
  toolOptions: ToolOptionsStateType;
}): ZoomToolOptionsType => {
  return toolOptions.zoom;
};
