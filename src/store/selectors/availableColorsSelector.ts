import { Project } from "../../types/Project";
import { Category } from "../../types/Category";
import { COLORS } from "../../store";

export const availableColorsSelector = ({
  project,
}: {
  project: Project;
}): string[] => {
  const usedColors = project.categories.map((category: Category) => {
    return category.color;
  });
  return COLORS.filter((color: string) => !usedColors.includes(color));
};
