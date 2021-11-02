import { ImageViewer } from "../../types/ImageViewer";
import { ImageViewerImage } from "../../types/ImageViewerImage";

export const imagesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<ImageViewerImage> => {
  return imageViewer.images;
};
