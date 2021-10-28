import { HistoryStateType } from "../../types/HistoryStateType";

export const categoryCountsSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  const catDict: { [id: string]: number } = {};
  for (let category of state.present.categories) {
    catDict[category.id] = 0;
  }
  for (let image of state.present.images) {
    for (let annotation of image.annotations) {
      catDict[annotation.categoryId] += 1;
    }
  }
  return catDict;
};
