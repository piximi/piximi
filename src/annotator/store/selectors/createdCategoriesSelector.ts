import { HistoryStateType } from "../../types/HistoryStateType";
import { CategoryType } from "../../types/CategoryType";
import { sortBy } from "underscore";

export const createdCategoriesSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  const categories = state.present.categories.filter(
    (category: CategoryType) => {
      return category.id !== "00000000-0000-0000-0000-000000000000";
    }
  );

  return sortBy(categories, "name");
};
