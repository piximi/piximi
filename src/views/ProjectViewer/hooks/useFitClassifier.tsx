import { deepClone } from "@mui/x-data-grid/internals";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { dataSlice } from "store/data";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierModel,
  selectClassifierModelInfo,
  selectClassifierModelNameOrArch,
} from "store/classifier/reselectors";

import {
  selectActiveKnownCategories,
  selectActiveThings,
} from "store/project/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { applicationSettingsSlice } from "store/applicationSettings";
import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";
import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";

import { getStackTraceFromError } from "utils/logUtils";
import classifierHandler from "utils/models/classification/classifierHandler";
import { ModelStatus, Partition } from "utils/models/enums";
import { AlertType } from "utils/enums";
import { SequentialClassifier } from "utils/models/classification";
import { Thing, Kind, Category } from "store/data/types";
import { AlertState } from "utils/types";
import { ModelClassMap, ModelInfo } from "store/types";
import { useClassMapDialog } from "./useClassMapDialog";
import {
  prepareClasses,
  prepareModel,
  prepareTrainingData,
  trainModel,
} from "utils/models/classification/utils";

export const useFitClassifier = () => {
  const dispatch = useDispatch();
  const activeData = useSelector(selectActiveThings);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const activeKindId = useSelector(selectActiveKindId);
  const knownCategories = useSelector(selectActiveKnownCategories);
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const selectedModel = useSelector(selectClassifierModel);

  const { setTotalEpochs, epochEndCallback } = useClassifierHistory();
  const { newModelName, setModelStatus } = useClassifierStatus();

  const { getClassMap } = useClassMapDialog();
  const addClassificationModel = useCallback(
    async (
      newModelName: string,
      modelArchitecture: 0 | 1,
      baseModelInfo: ModelInfo,
      kindId: Kind["id"],
    ) => {
      const newModel = await classifierHandler.createNewModel(
        newModelName,
        modelArchitecture,
      );
      const newModelInfo = deepClone(baseModelInfo);

      dispatch(
        classifierSlice.actions.addModelInfo({
          kindId: kindId,
          modelName: newModelName,
          modelInfo: newModelInfo,
        }),
      );
      return newModel;
    },
    [],
  );

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
    // updates the the total number of epochs the model will train for (for display purposes)
    setTotalEpochs(
      (totalEpochs) => totalEpochs + modelInfo.optimizerSettings.epochs,
    );

    let initFit: boolean = !selectedModel?.pretrained;
    let model: SequentialClassifier;
    let classMap = modelInfo.classMap;

    try {
      // if the model name or architecture is a number, we create a new model using specified model architecture
      if (typeof modelNameOrArch === "number") {
        initFit = true;
        model = await addClassificationModel(
          newModelName!,
          modelNameOrArch as 0 | 1,
          modelInfo,
          activeKindId,
        );

        // create a class map for the new model
        classMap = knownCategories.reduce(
          (map: ModelClassMap, category, idx) => {
            map[idx] = category.id;
            return map;
          },
          {},
        );
        dispatch(
          classifierSlice.actions.addModelClassMapping({
            kindId: activeKindId,
            modelName: model.name,
            classMapping: classMap,
          }),
        );
      } else {
        model = selectedModel!;
      }
    } catch (error) {
      handleError(error as Error, "Model Generation Error");
      return;
    }

    // if the class map is not set, we need to get it from the user
    if (!classMap) {
      const setMapping = await getClassMap({
        projectCategories: knownCategories,
        modelClasses: model.classes,
      });

      if (!setMapping) return;

      classMap = setMapping as ModelClassMap;
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          kindId: activeKindId,
          modelName: model.name,
          classMapping: classMap,
        }),
      );
    }

    setModelStatus(ModelStatus.Loading);

    let partitionedData: {
      unlabeledThings: Thing[];
      labeledUnassigned: Thing[];
      labeledTraining: Thing[];
      labeledValidation: Thing[];
      splitLabeledTraining: Thing[];
      splitLabeledValidation: Thing[];
    };
    let categoryInfo: { categories: Category[]; numClasses: number };
    try {
      partitionedData = prepareTrainingData(
        modelInfo.preprocessSettings.shuffle,
        modelInfo.preprocessSettings.trainingPercentage,
        initFit,
        activeData,
      );
    } catch (error) {
      handleError(error as Error, "Data Partitioning Error");
      return;
    }
    if (initFit) {
      try {
        categoryInfo = prepareClasses(knownCategories);
        await prepareModel(
          model,
          [
            ...partitionedData.labeledTraining,
            ...partitionedData.splitLabeledTraining,
          ],
          [
            ...partitionedData.labeledValidation,
            ...partitionedData.splitLabeledValidation,
          ],
          categoryInfo.numClasses,
          categoryInfo.categories,
          modelInfo.preprocessSettings,
          modelInfo.optimizerSettings,
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
    } else if (!selectedModel?.trainingLoaded) {
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
      model.loadTraining(
        [
          ...partitionedData.labeledTraining,
          ...partitionedData.splitLabeledTraining,
        ],
        Object.values(classMap).map((id) => ({ id })),
      );
      model.loadValidation(
        [
          ...partitionedData.labeledValidation,
          ...partitionedData.splitLabeledValidation,
        ],
        Object.values(classMap).map((id) => ({ id })),
      );
    } else {
      if (partitionedData.splitLabeledTraining.length > 0) {
        model.loadTraining(
          partitionedData.splitLabeledTraining,
          Object.values(classMap).map((id) => ({ id })),
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
      await trainModel(model, epochEndCallback, modelInfo.optimizerSettings);
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
    knownCategories,
    modelInfo,
    handleError,
    dispatch,
  ]);

  return fitClassifier;
};
