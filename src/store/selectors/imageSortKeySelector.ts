import { ImageSortKeyType } from "types/ImageSortType";
import { Project } from "types/Project";

export const imageSortKeySelector = ({
  project,
}: {
  project: Project;
}): ImageSortKeyType => {
  return project.imageSortKey;
};
