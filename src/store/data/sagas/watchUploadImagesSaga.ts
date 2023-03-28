import { takeLeading } from "redux-saga/effects";

import { uploadImagesSaga } from "./uploadImagesSaga";

import { DataSlice } from "store/data";

export function* watchUploadImagesSaga() {
  yield takeLeading(DataSlice.actions.uploadImages, uploadImagesSaga);
}
