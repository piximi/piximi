import { HistoryStateType } from "../../types/HistoryStateType";

export const visibleCategoriesSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  return state.present.categories
    .filter((category) => category.visible)
    .map((category) => {
      return category.id;
    });
};
