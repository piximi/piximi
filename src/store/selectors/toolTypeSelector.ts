import { ImageViewer } from "../../types/ImageViewer";
import { ToolType } from "../../types/ToolType";

export const toolTypeSelector = (imageViewer: ImageViewer): ToolType => {
  return imageViewer.toolType;
};
