import { ImageViewer } from "../../types/ImageViewer";
export const visibleCategoriesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.categories
    .filter((category) => category.visible)
    .map((category) => {
      return category.id;
    });
};
