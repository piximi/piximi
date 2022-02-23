import { ImageViewer } from "../../types/ImageViewer";
import { Category } from "../../types/Category";

export const annotationCategorySelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Category> => {
  return imageViewer.categories;
};
