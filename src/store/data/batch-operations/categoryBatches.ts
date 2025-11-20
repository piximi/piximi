import { WritableDraft } from "immer";
import { DataState } from "store/types";
import { deleteCategoryCascade } from "../cascade-operations/categoryCascades";

export const deleteCategoryBatch = (
  state: WritableDraft<DataState>,
  categoryIds: string[],
) => {
  categoryIds.forEach((id) => deleteCategoryCascade(state, id));
};
