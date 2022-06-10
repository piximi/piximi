import { ImageViewer } from "types/ImageViewer";
import { Category } from "types/Category";
import { COLORS } from "colorPalette";

export const availableAnnotationColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string[] => {
  const usedColors = imageViewer.categories.map((category: Category) => {
    return category.color;
  });
  return COLORS.filter((color: string) => !usedColors.includes(color));
};
