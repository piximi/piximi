import { ImageViewerStore, ToolType } from "types";

export const toolTypeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): ToolType => {
  return imageViewer.toolType;
};
