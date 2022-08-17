import * as tensorflow from "@tensorflow/tfjs";
import { put, select } from "redux-saga/effects";

import {
  classifierSlice,
  classifierArchitectureOptionsSelector,
  classifierFitOptionsSelector,
  classifierFittedSelector,
  classifierPreprocessOptionsSelector,
  predictCategories,
  preprocess,
} from "store/classifier";
import {
  createdCategoriesSelector,
  projectSlice,
  testImagesSelector,
} from "store/project";
import { applicationSlice } from "store/application";

import {
  AlertStateType,
  AlertType,
  ArchitectureOptions,
  Category,
  FitOptions,
  ImageType,
  PreprocessOptions,
  Shape,
} from "types";

import { getStackTraceFromError } from "utils/getStackTrace";

export function* predictSaga(action: any): any {
  const testImages: Array<ImageType> = yield select(testImagesSelector);

  const categories: Category[] = yield select(createdCategoriesSelector);

  const architectureOptions: ArchitectureOptions = yield select(
    classifierArchitectureOptionsSelector
  );

  const preprocessOptions: PreprocessOptions = yield select(
    classifierPreprocessOptionsSelector
  );

  const fitOptions: FitOptions = yield select(classifierFitOptionsSelector);

  let model = yield select(classifierFittedSelector);

  const outputLayerSize = model.outputs[0].shape[1] as number;

  if (!testImages.length) {
    yield put(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Info,
          name: "Inference set is empty",
          description: "No unlabeled images to predict.",
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
    yield runPrediction(
      testImages,
      categories,
      architectureOptions.inputShape,
      preprocessOptions,
      fitOptions,
      model
    );
  }

  yield put(
    classifierSlice.actions.updatePredicting({
      predicting: false,
    })
  );
}

function* runPrediction(
  testImages: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  model: tensorflow.LayersModel
) {
  var data: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
    ids: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>;
  try {
    data = yield preprocess(
      testImages,
      categories,
      inputShape,
      preprocessOptions,
      fitOptions
    );
  } catch (error) {
    yield handleError(
      error as Error,
      "Error in preprocessing the inference data"
    );
    return;
  }

  try {
    var { imageIds, categoryIds } = yield predictCategories(
      model,
      data,
      categories
    ); //returns an array of Image ID and an array of corresponding categories ID
  } catch (error) {
    yield handleError(error as Error, "Error predicting the inference data");
    return;
  }

  yield put(
    projectSlice.actions.updateImagesCategories({
      ids: imageIds,
      categoryIds: categoryIds,
    })
  );

  yield put(
    classifierSlice.actions.updatePredicted({
      predicted: true,
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
