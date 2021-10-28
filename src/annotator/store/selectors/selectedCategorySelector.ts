import { HistoryStateType } from "../../types/HistoryStateType";
import * as _ from "lodash";
import { CategoryType } from "../../types/CategoryType";

export const selectedCategorySelector = ({
  state,
}: {
  state: HistoryStateType;
}): CategoryType => {
  const category = _.find(
    state.present.categories,
    (category: CategoryType) => {
      return category.id === state.present.selectedCategory;
    }
  );

  return category!;
};
