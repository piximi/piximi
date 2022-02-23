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
import { classifierSlice } from "../../slices";
import { evaluate } from "store/coroutines/classifier/evaluate";
import * as tensorflow from "@tensorflow/tfjs";
import { put, select } from "redux-saga/effects";

export function* evaluateSaga(action: any): any {
  const model: tensorflow.LayersModel = yield select(fittedSelector);
  const validationImages: Array<ImageType> = yield select(valImagesSelector);
  const rescaleOptions: RescaleOptions = yield select(rescaleOptionsSelector);
  const architectureOptions: ArchitectureOptions = yield select(
    architectureOptionsSelector
  );
  const categories: Array<Category> = yield select(createdCategoriesSelector);

  const outputLayerSize = model.outputs[0].shape[1] as number;

  if (validationImages.length === 0) {
    alert("Validation set is empty!");
  } else if (outputLayerSize !== categories.length) {
    alert(
      "The output shape of your model does not correspond to the number of categories!"
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
  const validationData: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank>;
    id: string;
  }> = yield preprocess_predict(
    validationImages,
    rescaleOptions,
    architectureOptions.inputShape
  );

  const evaluationResult: EvaluationResultType = yield evaluate(
    model,
    validationData,
    validationImages,
    categories
  );

  yield put(
    classifierSlice.actions.updateEvaluationResult({
      evaluationResult,
    })
  );
}
