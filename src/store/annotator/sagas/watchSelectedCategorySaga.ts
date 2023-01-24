import { takeEvery } from "redux-saga/effects";

import { selectedCategorySaga } from "./selectedCategorySaga";

import { AnnotatorSlice } from "store/annotator";

export function* watchSelectedCategorySaga() {
  yield takeEvery(
    AnnotatorSlice.actions.setSelectedCategoryId,
    selectedCategorySaga
  );
}
