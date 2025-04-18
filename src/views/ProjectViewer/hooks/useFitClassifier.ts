import { deepClone } from "@mui/x-data-grid/internals";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { getStackTraceFromError, getSubset } from "utils/common/helpers";
import { FitOptions, OptimizerSettings } from "utils/models/types";
import { dataSlice } from "store/data";
import { ModelStatus, Partition } from "utils/models/enums";
import { AlertState } from "utils/common/types";
import { AlertType } from "utils/common/enums";
import { applicationSettingsSlice } from "store/applicationSettings";
import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";
import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";

export const getClassificationModel = async (
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

export const useFitClassifier = () => {
  const dispatch = useDispatch();
  const activeData = useSelector(selectActiveLabeledThings);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const activeKindId = useSelector(selectActiveKindId);
  const activeCategories = useSelector(selectActiveCategories);
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const selectedModel = useSelector(selectClassifierModel);
  const { setTotalEpochs, epochEndCallback } = useClassifierHistory();
  const { newModelName, setModelStatus } = useClassifierStatus();

  const handleError = useCallback(
    async (error: Error, name: string) => {
      const stackTrace = await getStackTraceFromError(error);
      const alertState: AlertState = {
        alertType: AlertType.Error,
        name: name,
        description: `${error.name}:\n${error.message}`,
        stackTrace: stackTrace,
      };
      if (import.meta.env.NODE_ENV !== "production") {
        console.error(
          alertState.name,
          "\n",
          alertState.description,
          "\n",
          alertState.stackTrace,
        );
      }
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: alertState,
        }),
      );
      setModelStatus(ModelStatus.Idle);
    },
    [dispatch],
  );
  const fitClassifier = useCallback(async () => {
    setTotalEpochs(
      (totalEpochs) => totalEpochs + modelInfo.params.optimizerSettings.epochs,
    );
    let initFit: boolean = false;
    let model: SequentialClassifier;
    try {
      if (typeof modelNameOrArch === "number") {
        model = await getClassificationModel(
          newModelName!,
          modelNameOrArch as 0 | 1,
          modelInfo,
          activeKindId,
        );
        initFit = true;
      } else {
        model = selectedModel!;
      }
    } catch (error) {
      handleError(error as Error, "Model Generation Error");
      return;
    }
    setModelStatus(ModelStatus.Loading);
    let partitionedData: {
      unlabeledThings: Thing[];
      labeledUnassigned: Thing[];
      labeledTraining: Thing[];
      splitLabeledTraining: Thing[];
      splitLabeledValidation: Thing[];
    };
    let categoryInfo: { categories: Category[]; numClasses: number };
    try {
      partitionedData = prepareTrainingData(
        modelInfo.params.preprocessSettings.shuffle,
        modelInfo.params.preprocessSettings.trainingPercentage,
        initFit,
        activeData,
      );

      categoryInfo = prepareClasses(activeCategories);
    } catch (error) {
      handleError(error as Error, "Data Partitioning Error");
      return;
    }
    const compileOptions = getSubset(modelInfo.params.optimizerSettings, [
      "learningRate",
      "lossFunction",
      "metrics",
      "optimizationAlgorithm",
      "batchSize",
    ]) as OptimizerSettings;
    const fitOptions = getSubset(modelInfo.params.optimizerSettings, [
      "batchSize",
      "epochs",
    ]) as FitOptions;

    if (initFit) {
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
        );
        dispatch(
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
      } catch (error) {
        handleError(error as Error, "Model Preparation Error");
        return;
      }
    } else {
      if (
        partitionedData.splitLabeledTraining.length > 0 ||
        partitionedData.splitLabeledValidation.length > 0
      ) {
        model.loadTraining(
          [
            ...partitionedData.labeledTraining,
            ...partitionedData.splitLabeledTraining,
          ],
          categoryInfo.categories,
        );

        dispatch(
          dataSlice.actions.updateThings({
            updates: partitionedData.labeledUnassigned.map((thing) => ({
              id: thing.id,
              partition: Partition.Training,
            })),
          }),
        );
      }
    }

    setModelStatus(ModelStatus.Training);
    try {
      await trainModel(model, epochEndCallback, fitOptions);
    } catch (error) {
      handleError(error as Error, "Model Training Error");
      return;
    }
    setModelStatus(ModelStatus.Idle);
    dispatch(
      classifierSlice.actions.updateSelectedModelNameOrArch({
        modelName: model.name,
        kindId: activeKindId,
      }),
    );
  }, [
    modelNameOrArch,
    selectedModel,
    newModelName,
    activeKindId,
    activeData,
    activeCategories,
    modelInfo,
    handleError,
    dispatch,
  ]);

  return fitClassifier;
};

export default useFitClassifier;
