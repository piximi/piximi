import { takeEvery } from "redux-saga/effects";

import { selectedCategorySaga } from "./selectedCategorySaga";

import { imageViewerSlice } from "store/annotator";

export function* watchSelectedCategorySaga() {
  yield takeEvery(
    imageViewerSlice.actions.setSelectedCategoryId,
    selectedCategorySaga
  );
}
