import { takeLatest } from "redux-saga/effects";

import {
  deleteAllAnnotationCategories,
  deleteAnnotationCategory,
} from "../projectSlice";
import { deleteAnnotationCategorySaga } from "./deleteAnnotationCategorySaga";
import { deleteAllAnnotationCategoriesSaga } from "./deleteAllAnnotationCategoriesSaga";

export function* watchDeleteAnnotationCategorySaga() {
  yield takeLatest(deleteAnnotationCategory, deleteAnnotationCategorySaga);
}

export function* watchDeleteAllAnnotationCategorySaga() {
  yield takeLatest(
    deleteAllAnnotationCategories.toString(),
    deleteAllAnnotationCategoriesSaga
  );
}
