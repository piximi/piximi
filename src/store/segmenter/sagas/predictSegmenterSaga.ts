import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";

import {
  dataSlice,
  selectUnannotatedImages,
  selectAllAnnotationCategories,
} from "store/data";
import {
  segmenterInputShapeSelector,
  segmenterPreprocessOptionsSelector,
  segmenterFitOptionsSelector,
  segmenterSlice,
  segmenterModelSelector,
} from "store/segmenter";
import {
  //AlertStateType,
  AlertType,
  Category,
  FitOptions,
  ImageType,
  Partition,
  PreprocessOptions,
  Shape,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  DecodedAnnotationType,
} from "types";
//import { getStackTraceFromError } from "utils";
import COCO_CLASSES from "data/model-data/cocossd-classes";
import { ModelStatus } from "types/ModelType";
import { CocoSSD } from "utils/common/models/CocoSSD/CocoSSD";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

export function* predictSegmenterSaga({
  payload: { execSaga, modelStatus },
}: PayloadAction<{ modelStatus: ModelStatus; execSaga: boolean }>) {
  if (!execSaga || modelStatus !== ModelStatus.Predicting) return;

  const inferenceImages: ReturnType<typeof selectUnannotatedImages> =
    yield select(selectUnannotatedImages);

  if (!inferenceImages.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Inference set is empty",
          description: "No unlabeled images to predict.",
        },
      })
    );

    yield put(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
        execSaga: false,
      })
    );

    return;
  }

  // assign each of the inference images to the validation partition
  // TODO - segmenter: they should go in the inference partition
  yield put(
    dataSlice.actions.updateSegmentationImagesPartition({
      imageIdsByPartition: {
        [Partition.Validation]: inferenceImages.map((image) => image.id),
      },
    })
  );

  // annotationCategories: the annotation categories in the project slice
  const annotationCategories: ReturnType<typeof selectAllAnnotationCategories> =
    yield select(selectAllAnnotationCategories);

  const createdCategories = annotationCategories.filter((category) => {
    return category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID;
  });

  const model: ReturnType<typeof segmenterModelSelector> = yield select(
    segmenterModelSelector
  );

  let possibleClasses: {
    [key: string]: { name: string; id: number; displayName: string };
  } = {};

  if (model instanceof CocoSSD) {
    possibleClasses = COCO_CLASSES;
  }

  const inputShape: ReturnType<typeof segmenterInputShapeSelector> =
    yield select(segmenterInputShapeSelector);

  // preprocessOption: {shuffle: true, rescaleOptions:{rescale:true, center: true}}
  const preprocessOptions: ReturnType<
    typeof segmenterPreprocessOptionsSelector
  > = yield select(segmenterPreprocessOptionsSelector);

  // fitOptions: {epochs: 10, batchSize:32, initialEpoch: 0}
  const fitOptions: ReturnType<typeof segmenterFitOptionsSelector> =
    yield select(segmenterFitOptionsSelector);

  yield runSegmentationPrediction(
    model,
    inferenceImages,
    annotationCategories,
    createdCategories,
    inputShape,
    preprocessOptions,
    fitOptions,
    possibleClasses
  );

  yield put(
    segmenterSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Suggesting,
      execSaga: false,
    })
  );
}

function* runSegmentationPrediction(
  model: Segmenter,
  inferenceImages: Array<ImageType>,
  categories: Array<Category>,
  createdCategories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  possibleClasses: {
    [key: string]: { name: string; id: number; displayName: string };
  }
) {
  let predictedAnnotations: Array<{
    imageId: string;
    annotations: DecodedAnnotationType[];
  }> = model.predict("options", "callbacks");

  const foundCategories: Category[] = [];
  let index = 0;
  while (index < foundCategories.length) {
    const foundCat = foundCategories[index];
    yield put(
      dataSlice.actions.createAnnotationCategory({
        name: foundCat.name,
        color: foundCat.color,
        id: foundCat.id,
      })
    );
    index++;
  }

  index = 0;
  while (index < predictedAnnotations.length) {
    yield put(
      dataSlice.actions.updateImageAnnotations({
        imageId: predictedAnnotations[index].imageId,
        annotations: predictedAnnotations[index].annotations,
      })
    );

    index++;
  }
}

// function* handleError(error: Error, name: string) {
//   const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
//     yield getStackTraceFromError(error);

//   const alertState: AlertStateType = {
//     alertType: AlertType.Error,
//     name: name,
//     description: `${error.name}:\n${error.message}`,
//     stackTrace: stackTrace,
//   };

//   yield put(
//     applicationSlice.actions.updateAlertState({
//       alertState: alertState,
//     })
//   );
// }
