import { takeLeading } from "redux-saga/effects";

import { uploadImagesSaga } from "./uploadImagesSaga";

import { dataSlice } from "store/data";

export function* watchUploadImagesSaga() {
  yield takeLeading(dataSlice.actions.uploadImages, uploadImagesSaga);
}
