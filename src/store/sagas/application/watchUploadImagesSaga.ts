import { takeLeading } from "redux-saga/effects";
import { applicationSlice } from "../../slices";
import { uploadImagesSaga } from "./uploadImagesSaga";

export function* watchUploadImagesSaga(): any {
  yield takeLeading(applicationSlice.actions.uploadImages, uploadImagesSaga);
}
