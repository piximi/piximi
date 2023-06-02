import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";

import {
  dataSlice,
  selectUnannotatedImages,
  selectAllAnnotationCategories,
} from "store/data";
import {
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
  // PreprocessOptions,
  // Shape,
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

  // TODO - segmenter: make sure this doesn't clash with classifier inference set
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

  // const inputShape: ReturnType<typeof segmenterInputShapeSelector> =
  //   yield select(segmenterInputShapeSelector);

  // const preprocessOptions: ReturnType<
  //   typeof segmenterPreprocessOptionsSelector
  // > = yield select(segmenterPreprocessOptionsSelector);

  // fitOptions: {epochs: 10, batchSize:32, initialEpoch: 0}
  const fitOptions: ReturnType<typeof segmenterFitOptionsSelector> =
    yield select(segmenterFitOptionsSelector);

  yield runPrediction(
    model,
    inferenceImages,
    createdCategories,
    // inputShape,
    //preprocessOptions,
    fitOptions
  );

  yield put(
    segmenterSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Trained,
      execSaga: false,
    })
  );
}

function* runPrediction(
  model: Segmenter,
  inferenceImages: Array<ImageType>,
  currentCategories: Array<Category>,
  // inputShape: Shape,
  //preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions
) {
  // TODO - segmenter: generalize to model.trainable?, or maybe model.cannotTrainButCanUseCustomLabelsSomehow?
  const generateCategories = model instanceof CocoSSD ? true : false;

  try {
    model.loadInference(inferenceImages, {
      categories: generateCategories ? undefined : currentCategories,
      fitOptions,
    });
  } catch (error) {
    yield handleError(
      error as Error,
      "Error in preprocessing the inference data"
    );
    return;
  }

  let predictedAnnotations: Awaited<ReturnType<typeof model.predict>> =
    yield model.predict();

  if (generateCategories) {
    const uniquePredictedIds = [
      ...new Set(
        predictedAnnotations.flatMap((imAnns) =>
          imAnns.map((ann) => ann.categoryId)
        )
      ),
    ];
    // TODO - segmenter: generalize inferenceCategoriesById, same way as above
    const generatedCategories = (model as CocoSSD).inferenceCategoriesById([
      // keep categories that we currently have, as long as they are also model categories
      ...currentCategories.map((cat) => cat.id),
      // add or keep categories that the model says exist
      ...uniquePredictedIds,
    ]);

    yield put(
      dataSlice.actions.setImageCategories({
        categories: generatedCategories,
      })
    );
  }

  for (const [i, annotations] of predictedAnnotations.entries()) {
    const imageId = inferenceImages[i].id;

    yield put(
      dataSlice.actions.updateImageAnnotations({
        imageId: imageId,
        annotations: predictedAnnotations[i],
      })
    );
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
