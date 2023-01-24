import { Project } from "types/Project";
import { Annotator } from "types/Annotator";

export const categoryCountsSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}) => {
  const catDict: { [id: string]: number } = {};
  for (let category of project.annotationCategories) {
    catDict[category.id] = 0;
  }
  for (let annotation of annotator.stagedAnnotations) {
    catDict[annotation.categoryId] += 1;
  }

  return catDict;
};
