import { takeEvery } from "redux-saga/effects";
import { imageViewerSlice } from "../../slices";
import { selectedCategorySaga } from "./selectedCategorySaga";

export function* watchSelectedCategorySaga() {
  yield takeEvery(
    imageViewerSlice.actions.setSelectedCategoryId,
    selectedCategorySaga
  );
}
