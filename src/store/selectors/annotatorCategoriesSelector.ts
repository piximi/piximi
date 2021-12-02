import { ImageViewer } from "../../types/ImageViewer";
export const annotatorCategoriesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.categories;
};
