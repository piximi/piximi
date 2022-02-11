import { put, select } from "redux-saga/effects";
import { classifierSlice } from "../../slices";
import { createdCategoriesSelector } from "../../selectors";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { fittedSelector } from "../../selectors/fittedSelector";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { Category } from "../../../types/Category";
import { valImagesSelector } from "store/selectors/valImagesSelector";
import { RescaleOptions } from "types/RescaleOptions";
import { EvaluationResultType } from "types/EvaluationResultType";
import { evaluate } from "store/coroutines/classifier/evaluate";

export function* evaluateSaga(action: any): any {
  const model = yield select(fittedSelector);
  const validationImages = yield select(valImagesSelector);
  const rescaleOptions: RescaleOptions = yield select(rescaleOptionsSelector);
  const architectureOptions = yield select(architectureOptionsSelector);
  const categories: Category[] = yield select(createdCategoriesSelector);

  if (validationImages.length === 0) {
    alert("Validation set is empty!");
    return;
  }

  const outputLayerSize = model.outputs[0].shape[1] as number;
  if (outputLayerSize !== categories.length) {
    alert(
      "The output shape of your model does not correspond to the number of categories!"
    );
    return;
  }

  const validationData = yield preprocess_predict(
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

  yield put(
    classifierSlice.actions.updateEvaluating({
      evaluating: false,
    })
  );
}
