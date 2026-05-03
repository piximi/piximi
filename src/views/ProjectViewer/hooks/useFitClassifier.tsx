import React, { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { deepClone } from "@mui/x-data-grid/internals";

import { classifierSlice } from "store/classifier";
import {
  selectActiveClassifierModel,
  selectClassifierModelInfo,
  selectActiveClassifierModelNameOrArch,
  selectActiveItems,
  selectActiveKnownCategories,
} from "@ProjectViewer/state/reselectors";
import type { Category } from "store/dataV2/types";
import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";
import { dataSliceV2 } from "store/dataV2";
import type { ModelClassMap, ModelInfo } from "store/classifier/types";

import classifierHandler from "utils/dl/classification/classifierHandler";
import { ModelStatus, Partition } from "utils/dl/enums";
import type { SequentialClassifier } from "utils/dl/classification";
import {
  prepareClasses,
  prepareModel,
  prepareTrainingData,
  trainModel,
} from "utils/dl/classification/utils";
import { toTrainingInput } from "utils/dl/utils";
import type { TrainingInput } from "utils/dl/types";

import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";
import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

export const useFitClassifier = () => {
  const dispatch = useDispatch();
  const activeItems = useSelector(selectActiveItems);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const knownCategories = useSelector(selectActiveKnownCategories);
  const modelNameOrArch = useSelector(selectActiveClassifierModelNameOrArch);
  const selectedModel = useSelector(selectActiveClassifierModel);

  // HOOKS
  const { setTotalEpochs, epochEndCallback } = useClassifierHistory();
  const { newModelName, setModelStatus } = useClassifierStatus();
  const { getClassMap } = useClassMapDialog();

  // HELPERS
  const addClassificationModel = useCallback(
    async (
      newModelName: string,
      modelArchitecture: 0 | 1,
      baseModelInfo: ModelInfo,
      kindId: string,
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
  const handleError = useClassifierErrorHandler();

  const dispatchPartition =
    modelTarget.id === IMAGE_CLASSIFIER_ID
      ? dataSliceV2.actions.batchUpdateImagePartition
      : dataSliceV2.actions.batchUpdateAnnotationPartition;

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
          modelTarget.id,
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
            kindId: modelTarget.id,
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
          kindId: modelTarget.id,
          modelName: model.name,
          classMapping: classMap,
        }),
      );
    }

    setModelStatus(ModelStatus.Loading);

    let partitionedData: {
      unlabeledThings: TrainingInput[];
      labeledUnassigned: TrainingInput[];
      labeledTraining: TrainingInput[];
      labeledValidation: TrainingInput[];
      splitLabeledTraining: TrainingInput[];
      splitLabeledValidation: TrainingInput[];
    };
    let categoryInfo: { categories: Category[]; numClasses: number };
    try {
      partitionedData = prepareTrainingData(
        modelInfo.preprocessSettings.shuffle,
        modelInfo.preprocessSettings.trainingPercentage,
        initFit,
        activeItems.map(toTrainingInput),
      );
    } catch (error) {
      handleError(error as Error, "Data Partitioning Error");
      return;
    }
    const trainingData = [
      ...partitionedData.labeledTraining,
      ...partitionedData.splitLabeledTraining,
    ];
    const validationData = [
      ...partitionedData.labeledValidation,
      ...partitionedData.splitLabeledValidation,
    ];
    if (trainingData.length === 0 || validationData.length === 0) {
      handleError(
        new Error(
          `Cannot train: need at least one training and one validation item ` +
            `(got ${trainingData.length} training, ${validationData.length} validation). ` +
            `Label more items or adjust the training percentage.`,
        ),
        "Insufficient Data",
      );
      return;
    }
    const trainingUpdates = partitionedData.splitLabeledTraining.map(
      (item) => ({
        id: item.id,
        partition: Partition.Training,
      }),
    );
    const validationUpdates = partitionedData.splitLabeledValidation.map(
      (thing) => ({
        id: thing.id,
        partition: Partition.Validation,
      }),
    );
    const inferenceUpdates = partitionedData.unlabeledThings.map((thing) => ({
      id: thing.id,
      partition: Partition.Inference,
    }));
    if (initFit) {
      try {
        categoryInfo = prepareClasses(knownCategories);

        await prepareModel(
          model,
          trainingData,
          validationData,
          categoryInfo.numClasses,
          categoryInfo.categories,
          modelInfo.preprocessSettings,
          modelInfo.optimizerSettings,
        );

        dispatch(
          dispatchPartition([
            ...trainingUpdates,
            ...validationUpdates,
            ...inferenceUpdates,
          ]),
        );
      } catch (error) {
        handleError(error as Error, "Model Preparation Error");
        return;
      }
    } else if (!selectedModel?.trainingLoaded) {
      dispatch(
        dispatchPartition([
          ...trainingUpdates,
          ...validationUpdates,
          ...inferenceUpdates,
        ]),
      );
      classifierHandler.loadTraining(
        model.name,
        trainingData,
        Object.values(classMap).map((id) => ({ id })),
      );
      classifierHandler.loadValidation(
        model.name,
        validationData,
        Object.values(classMap).map((id) => ({ id })),
      );
    } else {
      if (partitionedData.splitLabeledTraining.length > 0) {
        classifierHandler.loadTraining(
          model.name,
          partitionedData.splitLabeledTraining,
          Object.values(classMap).map((id) => ({ id })),
        );
        dispatch(
          dispatchPartition(
            partitionedData.labeledUnassigned.map((item) => ({
              id: item.id,
              partition: Partition.Training,
            })),
          ),
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
        kindId: modelTarget.id,
      }),
    );
  }, [
    modelNameOrArch,
    selectedModel,
    newModelName,
    modelTarget,
    activeItems,
    knownCategories,
    modelInfo,
    handleError,
    dispatch,
  ]);

  return fitClassifier;
};

export default useFitClassifier;
