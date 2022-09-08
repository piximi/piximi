import { Category, Project } from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

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
