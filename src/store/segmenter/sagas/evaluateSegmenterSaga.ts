import { PayloadAction } from "@reduxjs/toolkit";
import { select, put } from "redux-saga/effects";

import { applicationSlice } from "store/application";
import { selectImagesByPartition } from "store/data";

import {
  segmenterSlice,
  //segmenterModelSelector,
} from "store/segmenter";

import { AlertType, /*AlertStateType,*/ Partition } from "types";
import { ModelStatus } from "types/ModelType";
//import { getStackTraceFromError } from "utils";

export function* evaluateSegmenterSaga({
  payload: { execSaga, modelStatus },
}: PayloadAction<{ execSaga: boolean; modelStatus: ModelStatus }>) {
  if (!execSaga || modelStatus !== ModelStatus.Evaluating) return;

  // const model: ReturnType<typeof segmenterModelSelector> = yield select(
  //   segmenterModelSelector
  //);

  const validationImages: ReturnType<typeof selectImagesByPartition> =
    yield select((state) =>
      selectImagesByPartition(state, Partition.Validation)
    );

  yield put(applicationSlice.actions.hideAlertState({}));

  if (validationImages.length === 0) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Validation set is empty",
          description: "Cannot evaluate model on empty validation set.",
        },
      })
    );
  }

  yield put(
    segmenterSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Trained,
      execSaga: false,
    })
  );
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
