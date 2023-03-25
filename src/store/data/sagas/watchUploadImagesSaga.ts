import { takeLeading } from "redux-saga/effects";

import { uploadImagesSaga } from "./uploadImagesSaga";

import { dataSlice } from "../dataSlice";

export function* watchUploadImagesSaga() {
  yield takeLeading(dataSlice.actions.uploadImages, uploadImagesSaga);
}
