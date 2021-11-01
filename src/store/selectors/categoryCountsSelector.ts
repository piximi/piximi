import { ImageViewer } from "../../types/ImageViewer";
export const categoryCountsSelector = (imageViewer: ImageViewer) => {
  const catDict: { [id: string]: number } = {};
  for (let category of imageViewer.categories) {
    catDict[category.id] = 0;
  }
  for (let image of imageViewer.images) {
    for (let annotation of image.annotations) {
      catDict[annotation.categoryId] += 1;
    }
  }
  return catDict;
};
