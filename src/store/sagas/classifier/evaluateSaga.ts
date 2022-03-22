import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { ArchitectureOptions } from "types/ArchitectureOptions";
import { Category } from "../../../types/Category";
import { EvaluationResultType } from "types/EvaluationResultType";
import { ImageType } from "../../../types/ImageType";
import { RescaleOptions } from "types/RescaleOptions";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { createdCategoriesSelector } from "../../selectors";
import { fittedSelector } from "../../selectors/fittedSelector";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { valImagesSelector } from "store/selectors/valImagesSelector";
import { classifierSlice, applicationSlice } from "../../slices";
import { evaluate } from "store/coroutines/classifier/evaluate";
import * as tensorflow from "@tensorflow/tfjs";
import { put, select } from "redux-saga/effects";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";

export function* evaluateSaga(action: any): any {
  const model: tensorflow.LayersModel = yield select(fittedSelector);
  const validationImages: Array<ImageType> = yield select(valImagesSelector);
  const rescaleOptions: RescaleOptions = yield select(rescaleOptionsSelector);
  const architectureOptions: ArchitectureOptions = yield select(
    architectureOptionsSelector
  );
  yield put(applicationSlice.actions.hideAlertState({}));

  const categories: Array<Category> = yield select(createdCategoriesSelector);

  const outputLayerSize = model.outputs[0].shape[1] as number;

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
  } else if (outputLayerSize !== categories.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Warning,
          name: "The output shape of your model does not correspond to the number of categories!",
          description: `The trained model has an output shape of ${outputLayerSize} but there are ${categories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
        },
      })
    );
  } else {
    yield runEvaluation(
      validationImages,
      rescaleOptions,
      architectureOptions,
      model,
      categories
    );
  }

  yield put(
    classifierSlice.actions.updateEvaluating({
      evaluating: false,
    })
  );
}

function* runEvaluation(
  validationImages: Array<ImageType>,
  rescaleOptions: RescaleOptions,
  architectureOptions: ArchitectureOptions,
  model: tensorflow.LayersModel,
  categories: Array<Category>
) {
  try {
    var validationData: tensorflow.data.Dataset<{
      xs: tensorflow.Tensor<tensorflow.Rank>;
      id: string;
    }> = yield preprocess_predict(
      validationImages,
      rescaleOptions,
      architectureOptions.inputShape
    );
  } catch (error) {
    yield handleError(
      error as Error,
      "Error in preprocessing the validation data"
    );
    return;
  }

  try {
    var evaluationResult: EvaluationResultType = yield evaluate(
      model,
      validationData,
      validationImages,
      categories
    );
  } catch (error) {
    yield handleError(error as Error, "Error computing the evaluation results");
    return;
  }

  yield put(
    classifierSlice.actions.updateEvaluationResult({
      evaluationResult,
    })
  );
}

function* handleError(error: Error, name: string): any {
  const stackTrace = yield getStackTraceFromError(error);

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
