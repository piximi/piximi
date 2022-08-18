import { Category, Project } from "types";
import { CATEGORY_COLORS } from "colorPalette";

export const availableColorsSelector = ({
  project,
}: {
  project: Project;
}): string[] => {
  const usedColors = project.categories.map((category: Category) => {
    return category.color;
  });
  return Object.values(CATEGORY_COLORS).filter(
    (color: string) => !usedColors.includes(color)
  );
};
