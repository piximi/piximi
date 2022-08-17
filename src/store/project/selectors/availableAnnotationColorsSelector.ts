import { Project } from "types/Project";
import { Category } from "types/Category";
import { CATEGORY_COLORS } from "colorPalette";

export const availableAnnotationColorsSelector = ({
  project,
}: {
  project: Project;
}): string[] => {
  const usedColors = project.annotationCategories.map((category: Category) => {
    return category.color;
  });
  return Object.values(CATEGORY_COLORS).filter(
    (color: string) => !usedColors.includes(color)
  );
};
