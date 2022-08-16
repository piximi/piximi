import { takeLatest } from "redux-saga/effects";

import {
  activeImageColorChangeSaga,
  activeImageIDChangeSaga,
} from "./activeImageModifiedSaga";

import { imageViewerSlice } from "store/image-viewer";

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
