import { takeLatest } from "redux-saga/effects";

import {
  activeImageColorChangeSaga,
  activeImageIDChangeSaga,
} from "./activeImagIDChangeSaga";

import { AnnotatorSlice } from "store/annotator";

export function* watchActiveImageChangeSaga() {
  yield takeLatest(
    AnnotatorSlice.actions.setActiveImage,
    activeImageIDChangeSaga
  );
}

export function* watchActiveImageColorsChangeSaga() {
  yield takeLatest(
    AnnotatorSlice.actions.setImageColors,
    activeImageColorChangeSaga
  );
}
