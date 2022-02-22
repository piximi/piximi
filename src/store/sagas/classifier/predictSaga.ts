import { put, select } from "redux-saga/effects";
import { classifierSlice, projectSlice } from "../../slices";
import { createdCategoriesSelector } from "../../selectors";
import { rescaleOptionsSelector } from "../../selectors/rescaleOptionsSelector";
import { preprocess_predict } from "../../coroutines/classifier/preprocess_predict";
import { predictCategories } from "../../coroutines/classifier/predictCategories";
import { testImagesSelector } from "../../selectors/testImagesSelector";
import { fittedSelector } from "../../selectors/fittedSelector";
import { architectureOptionsSelector } from "../../selectors/architectureOptionsSelector";
import { Category } from "../../../types/Category";
import { RescaleOptions } from "types/RescaleOptions";
import { ArchitectureOptions } from "types/ArchitectureOptions";
import { Image } from "../../../types/Image";
import * as tensorflow from "@tensorflow/tfjs";

export function* predictSaga(action: any): any {
  const rescaleOptions: RescaleOptions = yield select(rescaleOptionsSelector);

  let model = yield select(fittedSelector);

  const architectureOptions: ArchitectureOptions = yield select(
    architectureOptionsSelector
  );

  const categories: Category[] = yield select(createdCategoriesSelector);

  const testImages: Array<Image> = yield select(testImagesSelector);

  const outputLayerSize = model.outputs[0].shape[1] as number;

  if (!testImages.length) {
    alert("No unlabeled images to predict!");
  } else if (outputLayerSize !== categories.length) {
    alert(
      "The output shape of your model does not correspond to the number of categories!"
    );
  } else {
    yield runPrediction(
      testImages,
      rescaleOptions,
      architectureOptions,
      model,
      categories
    );
  }

  yield put(
    classifierSlice.actions.updatePredicting({
      predicting: false,
    })
  );
}

function* runPrediction(
  testImages: Array<Image>,
  rescaleOptions: RescaleOptions,
  architectureOptions: ArchitectureOptions,
  model: tensorflow.LayersModel,
  categories: Array<Category>
) {
  const data: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank>;
    id: string;
  }> = yield preprocess_predict(
    testImages,
    rescaleOptions,
    architectureOptions.inputShape
  );

  const { imageIds, categoryIds } = yield predictCategories(
    model,
    data,
    categories
  ); //returns an array of Image ID and an array of corresponding categories ID

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
