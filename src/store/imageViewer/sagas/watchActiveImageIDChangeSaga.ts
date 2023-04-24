import { takeLatest } from "redux-saga/effects";

import {
  activeImageColorChangeSaga,
  activeImageIDChangeSaga,
} from "./activeImagIDChangeSaga";

import { imageViewerSlice } from "store/imageViewer";
import { dataSlice } from "store/data";

export function* watchActiveImageChangeSaga() {
  yield takeLatest(
    imageViewerSlice.actions.setActiveImageId,
    activeImageIDChangeSaga
  );
}

export function* watchActiveImageColorsChangeSaga() {
  yield takeLatest(
    dataSlice.actions.updateImage.type,
    activeImageColorChangeSaga
  );
}
