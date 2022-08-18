import { ImageViewer, ToolType } from "types";

export const toolTypeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): ToolType => {
  return imageViewer.toolType;
};
