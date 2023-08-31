import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSlice } from "store/application";

import {
  dataSlice,
  selectUnannotatedImages,
  selectAllAnnotationCategories,
} from "store/data";
import {
  selectSegmenterFitOptions,
  segmenterSlice,
  selectSegmenterModel,
} from "store/segmenter";
import {
  AlertStateType,
  AlertType,
  Category,
  FitOptions,
  ImageType,
  Partition,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
} from "types";
import { getStackTraceFromError } from "utils";
import { ModelStatus } from "types/ModelType";
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

  const model: ReturnType<typeof selectSegmenterModel> = yield select(
    selectSegmenterModel
  );

  const fitOptions: ReturnType<typeof selectSegmenterFitOptions> = yield select(
    selectSegmenterFitOptions
  );

  yield runPrediction(model, inferenceImages, createdCategories, fitOptions);

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
  fitOptions: FitOptions
) {
  // if it's not trainable, it must not have been previously trained with custom categories
  // will need to be extend to account for trainable but has not been trained
  // and user uploaded with/without labels
  const generateCategories = !model.trainable;

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

  try {
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

      const generatedCategories = model.inferenceCategoriesById([
        // keep categories that we currently have, as long as they are also model categories
        ...currentCategories.map((cat) => cat.id),
        // add or keep categories that the model says exist
        ...uniquePredictedIds,
      ]);

      yield put(
        dataSlice.actions.addAnnotationCategories({
          annotationCategories: generatedCategories,
          isPermanent: true,
        })
      );
    }

    for (const [i, annotations] of predictedAnnotations.entries()) {
      const imageId = inferenceImages[i].id;

      yield put(
        dataSlice.actions.setAnnotationsByImage({
          imageId,
          annotations: annotations.map((ann) => ({ ...ann, imageId })),
          isPermanent: true,
        })
      );
    }
  } catch (error) {
    yield handleError(error as Error, "Error in running prediction");
    return;
  }
}

function* handleError(error: Error, name: string) {
  const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
    yield getStackTraceFromError(error);

  const alertState: AlertStateType = {
    alertType: AlertType.Error,
    name: name,
    description: `${error.name}:\n${error.message}`,
    stackTrace: stackTrace,
  };

  yield put(
    applicationSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );
}
