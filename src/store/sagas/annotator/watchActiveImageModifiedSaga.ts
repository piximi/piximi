import { imageViewerSlice } from "../../slices";
import { takeEvery } from "redux-saga/effects";
import {
  activeImageColorChangeSaga,
  activeImageIDChangeSaga,
} from "./activeImageModifiedSaga";

export function* watchActiveImageChangeSaga() {
  yield takeEvery(
    imageViewerSlice.actions.setActiveImage,
    activeImageIDChangeSaga
  );
}

export function* watchActiveImageColorsChangeSaga() {
  yield takeEvery(
    imageViewerSlice.actions.setImageColors,
    activeImageColorChangeSaga
  );
}
