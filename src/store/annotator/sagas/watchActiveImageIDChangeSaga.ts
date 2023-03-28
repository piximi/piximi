import { takeLatest } from "redux-saga/effects";

import {
  activeImageColorChangeSaga,
  activeImageIDChangeSaga,
} from "./activeImagIDChangeSaga";

import { AnnotatorSlice } from "store/annotator";
import { DataSlice } from "store/data";

export function* watchActiveImageChangeSaga() {
  yield takeLatest(
    AnnotatorSlice.actions.setActiveImageId,
    activeImageIDChangeSaga
  );
}

export function* watchActiveImageColorsChangeSaga() {
  yield takeLatest(
    DataSlice.actions.updateStagedImage.type,
    activeImageColorChangeSaga
  );
}
