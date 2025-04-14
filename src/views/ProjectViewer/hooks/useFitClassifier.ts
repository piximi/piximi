import { deepClone } from "@mui/x-data-grid/internals";
import React, { useCallback } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierModel,
  selectClassifierModelInfo,
  selectClassifierModelNameOrArch,
} from "store/classifier/reselectors";
import { Thing, Kind, Category } from "store/data/types";
import {
  selectActiveCategories,
  selectActiveLabeledThings,
} from "store/project/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { ModelInfo } from "store/types";
import { createNewModel } from "utils/models/availableClassificationModels";
import { SequentialClassifier } from "utils/models/classification";
import { productionStore } from "store";
import {
  prepareClasses,
  prepareModel,
  prepareTrainingData,
  trainModel,
} from "store/classifier/fit";
import { getSubset } from "utils/common/helpers";
import {
  FitOptions,
  OptimizerSettings,
  TrainingCallbacks,
} from "utils/models/types";
import { dataSlice } from "store/data";
import { ModelStatus, Partition } from "utils/models/enums";

type TrainingPreperationReturnType = {
  partitionedData: {
    unlabeledThings: Thing[];
    labeledUnassigned: Thing[];
    splitLabeledTraining: Thing[];
    splitLabeledValidation: Thing[];
  };
  model: SequentialClassifier;
  fitOptions: FitOptions;
};
const generateNewModel = async (
  newModelName: string,
  modelArchitecture: 0 | 1,
  baseModelInfo: ModelInfo,
  kindId: Kind["id"],
) => {
  const newModel = await createNewModel(newModelName, modelArchitecture);
  const newModelInfo = deepClone(baseModelInfo);

  productionStore.dispatch(
    classifierSlice.actions.addModelInfo({
      kindId: kindId,
      modelName: newModelName,
      modelInfo: newModelInfo,
    }),
  );
  return newModel;
};
export async function prepareTrainingCB(
  selectedModelOrArch: SequentialClassifier,
  modelInfo: ModelInfo,
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  onErrorCallback: (
    error: Error,
    name: string,
    kindId: Kind["id"],
    errorType?: { fittingError: boolean },
  ) => Promise<void>,
  data: Thing[],
  allCategories: Category[],
  kindId: Kind["id"],
): Promise<void>;
export async function prepareTrainingCB(
  selectedModelOrArch: 0 | 1,
  modelInfo: ModelInfo,
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  onErrorCallback: (
    error: Error,
    name: string,
    kindId: Kind["id"],
    errorType?: { fittingError: boolean },
  ) => Promise<void>,
  data: Thing[],
  allCategories: Category[],
  kindId: Kind["id"],
  newModelName: string,
): Promise<void>;
export async function prepareTrainingCB(
  selectedModelOrArch: SequentialClassifier | 0 | 1,
  modelInfo: ModelInfo,
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  onErrorCallback: (
    error: Error,
    name: string,
    kindId: Kind["id"],
    errorType?: { fittingError: boolean },
  ) => Promise<void>,
  data: Thing[],
  allCategories: Category[],
  kindId: Kind["id"],
  newModelName?: string,
) {
  let initFit: boolean = false;
  let model: SequentialClassifier;
  try {
    if (typeof selectedModelOrArch === "number") {
      model = await generateNewModel(
        newModelName!,
        selectedModelOrArch,
        modelInfo,
        kindId,
      );
      initFit = true;
    } else {
      model = selectedModelOrArch;
    }
  } catch (error) {
    onErrorCallback(error as Error, "Model Generation Error", kindId);
    return;
  }
  productionStore.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId,
      modelStatus: ModelStatus.Loading,
      nameOrArch: model.name,
    }),
  );
  let partitionedData: {
    unlabeledThings: Thing[];
    labeledUnassigned: Thing[];
    splitLabeledTraining: Thing[];
    splitLabeledValidation: Thing[];
  };
  let categoryInfo: { categories: Category[]; numClasses: number };
  try {
    partitionedData = prepareTrainingData(
      modelInfo.params.preprocessSettings.shuffle,
      modelInfo.params.preprocessSettings.trainingPercentage,
      initFit,
      data,
    );

    categoryInfo = prepareClasses(allCategories);
  } catch (error) {
    onErrorCallback(error as Error, "Data Partitioning Error", kindId);
    return;
  }

  const compileOptions = getSubset(modelInfo.params.optimizerSettings, [
    "learningRate",
    "lossFunction",
    "metrics",
    "optimizationAlgorithm",
  ]) as OptimizerSettings;
  const fitOptions = getSubset(modelInfo.params.optimizerSettings, [
    "batchSize",
    "epochs",
  ]) as FitOptions;

  try {
    await prepareModel(
      model,
      partitionedData.splitLabeledTraining,
      partitionedData.splitLabeledValidation,
      categoryInfo.numClasses,
      categoryInfo.categories,
      modelInfo.params.preprocessSettings,
      modelInfo.params.inputShape,
      compileOptions,
      fitOptions,
    );
  } catch (error) {
    onErrorCallback(error as Error, "Model Preparation Error", kindId);
    return;
  }

  if (initFit) {
    productionStore.dispatch(
      dataSlice.actions.updateThings({
        updates: [
          ...partitionedData.splitLabeledTraining.map((thing) => ({
            id: thing.id,
            partition: Partition.Training,
          })),
          ...partitionedData.splitLabeledValidation.map((thing) => ({
            id: thing.id,
            partition: Partition.Validation,
          })),
          ...partitionedData.unlabeledThings.map((thing) => ({
            id: thing.id,
            partition: Partition.Inference,
          })),
        ],
      }),
    );
  } else {
    productionStore.dispatch(
      dataSlice.actions.updateThings({
        updates: partitionedData.labeledUnassigned.map((thing) => ({
          id: thing.id,
          partition: Partition.Training,
        })),
      }),
    );
  }
  productionStore.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId,
      modelStatus: ModelStatus.Training,
      nameOrArch: model.name,
    }),
  );
  try {
    await trainModel(model, onEpochEnd, fitOptions);
  } catch (error) {
    onErrorCallback(error as Error, "Model Training Error", kindId);
    return;
  }
  productionStore.dispatch(
    classifierSlice.actions.updateModelStatus({
      kindId,
      modelStatus: ModelStatus.Trained,
      nameOrArch: model.name,
    }),
  );
}

const useFitClassifier = () => {
  const dispatch = useDispatch();
  const trainingData = useSelector(selectActiveLabeledThings);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const activeKindId = useSelector(selectActiveKindId);
  const categories = useSelector(selectActiveCategories);
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const selectedModel = useSelector(selectClassifierModel);

  const generateNewModel = useCallback(
    async (
      newModelName: string,
      modelArchitecture: 0 | 1,
      baseModelInfo: ModelInfo,
    ) => {
      const newModel = await createNewModel(newModelName, modelArchitecture);
      const newModelInfo = deepClone(baseModelInfo);

      dispatch(
        classifierSlice.actions.addModelInfo({
          kindId: activeKindId,
          modelName: newModelName,
          modelInfo: newModelInfo,
        }),
      );
      return newModel;
    },
    [],
  );

  const prepareTraining = useCallback(prepareTrainingCB, []);
};

export default useFitClassifier;
