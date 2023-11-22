import { PayloadAction } from "@reduxjs/toolkit";
import { put, select } from "redux-saga/effects";

import { applicationSettingsSlice } from "store/slices/applicationSettings";

import {
  dataSlice,
  selectUnannotatedImages,
  selectAllAnnotationCategories,
} from "store/slices/data";
import {
  selectSegmenterFitOptions,
  segmenterSlice,
  selectSegmenterModel,
} from "store/slices/segmenter";
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
import Image from "image-js";

export function* predictSegmenterSaga({
  payload: { execSaga, modelStatus },
}: PayloadAction<{ modelStatus: ModelStatus; execSaga: boolean }>) {
  if (!execSaga || modelStatus !== ModelStatus.Predicting) return;

  const inferenceImages: ReturnType<typeof selectUnannotatedImages> =
    yield select(selectUnannotatedImages);

  if (!inferenceImages.length) {
    yield put(
      applicationSettingsSlice.actions.updateAlertState({
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
    dataSlice.actions.updateImages({
      updates: inferenceImages.map((image) => ({
        id: image.id,
        partition: Partition.Inference,
      })),
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
          categories: generatedCategories,
          isPermanent: true,
        })
      );
    }

    for (const [i, annotations] of predictedAnnotations.entries()) {
      const imageId = inferenceImages[i].id;

      const imageSrc = inferenceImages[i].src;
      const loadedImg: Awaited<Image> = yield Image.load(imageSrc);

      for (let j = 0; j < annotations.length; j++) {
        const ann = annotations[j];
        const bbox = ann.boundingBox;

        const annObj = loadedImg.crop({
          x: bbox[0],
          y: bbox[1],
          width: bbox[2] - bbox[0],
          height: bbox[3] - bbox[1],
        });
        const src = annObj.getCanvas().toDataURL();

        annotations[j].src = src;
      }

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
    applicationSettingsSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );
}
