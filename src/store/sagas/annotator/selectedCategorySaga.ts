import { put, select } from "redux-saga/effects";
import * as _ from "lodash";
import { imageViewerSlice } from "../../slices";
import { selectedAnnotationsIdsSelector } from "../../selectors/selectedAnnotationsIdsSelector";
import { imageInstancesSelector } from "../../selectors/imageInstancesSelector";
import { selectedAnnotationsSelector } from "../../selectors/selectedAnnotationsSelector";
import { selectedAnnotationSelector } from "../../selectors/selectedAnnotationSelector";
import { selectedCategorySelector } from "../../selectors/selectedCategorySelector";
import { AnnotationType } from "../../../types/AnnotationType";

// eslint-disable-next-line no-empty-pattern
export function* selectedCategorySaga({}: {
  type: string;
  payload: { selectedCategoryId: string };
}): any {
  const selectedAnnotationsIds = yield select(selectedAnnotationsIdsSelector);
  if (!selectedAnnotationsIds) return;

  const annotations = yield select(imageInstancesSelector);
  if (!annotations.length) return;

  const selectedAnnotations = yield select(selectedAnnotationsSelector);
  const selectedCategory = yield select(selectedCategorySelector);

  const updatedAnnotations = _.map(
    selectedAnnotations,
    (annotation: AnnotationType) => {
      return { ...annotation, categoryId: selectedCategory.id };
    }
  );

  const selectedAnnotation = yield select(selectedAnnotationSelector);
  if (!selectedAnnotation) return;

  yield put(
    imageViewerSlice.actions.setSelectedAnnotations({
      selectedAnnotations: updatedAnnotations,
      selectedAnnotation: {
        ...selectedAnnotation,
        categoryId: selectedCategory.id,
      },
    })
  );
}
