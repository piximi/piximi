import { ImageViewer } from "../../types/ImageViewer";
import { Project } from "../../types/Project";
export const categoryCountsSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  const catDict: { [id: string]: number } = {};
  for (let category of imageViewer.categories) {
    catDict[category.id] = 0;
  }
  for (let image of project.images) {
    for (let annotation of image.annotations) {
      catDict[annotation.categoryId] += 1;
    }
  }
  return catDict;
};
