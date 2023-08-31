import { PayloadAction } from "@reduxjs/toolkit";
// import shuffle from "lodash/shuffle";
// import { select, put } from "redux-saga/effects";

// import { applicationSlice } from "store/application";
// import {
//   dataSlice,
//   selectAnnotatedImages,
//   selectAllAnnotationCategories,
//   selectImagesByPartitions,
// } from "store/data";
// import {
//   selectSegmenterTrainingPercentage,
//   selectSegmenterFitOptions,
//   selectSegmenterPreprocessOptions,
//   selectSegmenterCompileOptions,
//   segmenterSlice,
// } from "store/segmenter";
// import { compile } from "store/coroutines";
// import {
//   Partition,
//   ModelArchitecture,
//   AlertStateType,
//   AlertType,
//   ImageType,
// } from "types";
// import { getStackTraceFromError } from "utils";
import { ModelStatus } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";

export function* fitSegmenterSaga({
  payload: { onEpochEnd, execSaga, modelStatus },
}: PayloadAction<{
  modelStatus: ModelStatus;
  onEpochEnd?: TrainingCallbacks["onEpochEnd"];
  execSaga: boolean;
}>) {
  // if (!execSaga) return;
  // if (
  //   modelStatus !== ModelStatus.InitFit &&
  //   modelStatus !== ModelStatus.Training
  // )
  //   return;
  // const trainingPercentage: ReturnType<
  //   typeof selectSegmenterTrainingPercentage
  // > = yield select(selectSegmenterTrainingPercentage);
  // const annotatedImages: ReturnType<typeof selectAnnotatedImages> =
  //   yield select(selectAnnotatedImages);
  // const fitOptions: ReturnType<typeof selectSegmenterFitOptions> =
  //   yield select(selectSegmenterFitOptions);
  // const preprocessingOptions: ReturnType<
  //   typeof selectSegmenterPreprocessOptions
  // > = yield select(selectSegmenterPreprocessOptions);
  // const annotationCategories: ReturnType<typeof selectAllAnnotationCategories> =
  //   yield select(selectAllAnnotationCategories);
  // const compileOptions: ReturnType<typeof selectSegmenterCompileOptions> =
  //   yield select(selectSegmenterCompileOptions);
  // const categories: ReturnType<typeof selectAllAnnotationCategories> =
  //   yield select(selectAllAnnotationCategories);
  // const partitionSelector: ReturnType<typeof selectImagesByPartitions> = yield select(selectImagesByPartitions)
  // const trainImages = partitionSelector([Partition.Training])
  // const valImages = partitionSelector([Partition.Validation])
}

// function* handleError(error: Error, errorName: string) {
//   const stackTrace: Awaited<ReturnType<typeof getStackTraceFromError>> =
//     yield getStackTraceFromError(error);

//   const alertState: AlertStateType = {
//     alertType: AlertType.Error,
//     name: errorName,
//     description: `${error.name}:\n${error.message}`,
//     stackTrace: stackTrace,
//   };

//   yield put(
//     applicationSlice.actions.updateAlertState({
//       alertState: alertState,
//     })
//   );

//   yield put(
//     segmenterSlice.actions.updateModelStatus({
//       modelStatus: ModelStatus.Uninitialized,
//       execSaga: false,
//     })
//   );
// }
