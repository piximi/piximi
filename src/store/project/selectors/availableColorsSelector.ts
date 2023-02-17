import { Category, Project } from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

export const availableColorsSelector = ({
  project,
}: {
  project: Project;
}): string[] => {
  const usedColors = project.categories.map((category: Category) => {
    return category.color;
  });
  const availableColors = Object.values(CATEGORY_COLORS).filter(
    (color: string) => !usedColors.includes(color)
  );

  if (availableColors.length === 0) {
    // we're out of colors, recycle used ones
    return usedColors;
  } else {
    return availableColors;
  }
};
