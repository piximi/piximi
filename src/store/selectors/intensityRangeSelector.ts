import { ImageViewer } from "../../types/ImageViewer";
import { ChannelType } from "../../types/ChannelType";

export const channelsSelector = (
  imageViewer: ImageViewer
): Array<ChannelType> => {
  return imageViewer.channels;
};
