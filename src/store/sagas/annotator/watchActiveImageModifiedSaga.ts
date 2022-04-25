import { imageViewerSlice } from "../../slices";
import { takeLatest } from "redux-saga/effects";
import {
  activeImageColorChangeSaga,
  activeImageIDChangeSaga,
} from "./activeImageModifiedSaga";

export function* watchActiveImageChangeSaga() {
  yield takeLatest(
    imageViewerSlice.actions.setActiveImage,
    activeImageIDChangeSaga
  );
}

export function* watchActiveImageColorsChangeSaga() {
  yield takeLatest(
    imageViewerSlice.actions.setImageColors,
    activeImageColorChangeSaga
  );
}
