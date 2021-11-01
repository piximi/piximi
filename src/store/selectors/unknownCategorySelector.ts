import { ImageViewer } from "../../types/ImageViewer";
import { Category } from "../../types/Category";

export const unknownCategorySelector = (imageViewer: ImageViewer) => {
  return imageViewer.categories.find((category: Category) => {
    return category.id === "00000000-0000-0000-0000-000000000000";
  })!;
};
