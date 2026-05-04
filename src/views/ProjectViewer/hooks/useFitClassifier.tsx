import React, { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { deepClone } from "@mui/x-data-grid/internals";

import { classifierSlice } from "store/classifier";
import {
  selectActiveItems,
  selectActiveKnownCategories,
} from "@ProjectViewer/state/reselectors";
import type { Category } from "store/dataV2/types";
import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";
import { dataSliceV2 } from "store/dataV2";
import type { ModelClassMap } from "store/classifier/types";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";

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
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );
  const knownCategories = useSelector(selectActiveKnownCategories);

  // HOOKS
  const { setTotalEpochs, epochEndCallback } = useClassifierHistory();
  const { newModelName, setModelStatus } = useClassifierStatus();
  const { getClassMap } = useClassMapDialog();
  const handleError = useClassifierErrorHandler();

  const fitClassifier = useCallback(async () => {
    if (!kindClassifier) return;
    const modelName = kindClassifier.activeModel;
    const modelInfo = kindClassifier?.modelInfoDict[modelName ?? "base-model"];
    const dispatchPartition =
      kindClassifier.kindId === IMAGE_CLASSIFIER_ID
        ? dataSliceV2.actions.batchUpdateImagePartition
        : dataSliceV2.actions.batchUpdateAnnotationPartition;

    // updates the the total number of epochs the model will train for (for display purposes)
    setTotalEpochs(
      (totalEpochs) => totalEpochs + modelInfo.optimizerSettings.epochs,
    );

    let initFit: boolean;
    let model: SequentialClassifier;
    let classMap = modelInfo.classMap;

    try {
      // if the model name or architecture is a number, we create a new model using specified model architecture
      if (!modelName) {
        initFit = true;
        model = await classifierHandler.createNewModel(
          newModelName,
          kindClassifier.newModelArch,
        );
        const newModelInfo = deepClone(modelInfo);
        dispatch(
          classifierSlice.actions.addModelInfo({
            kindId: kindClassifier.kindId,
            modelName: newModelName,
            modelInfo: newModelInfo,
          }),
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
            kindId: kindClassifier.kindId,
            modelName: model.name,
            classMapping: classMap,
          }),
        );
      } else {
        initFit = false;
        model = classifierHandler.getModel(modelName);
        if (!model) throw Error(`No model for ${modelName}`);
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
          kindId: kindClassifier.kindId,
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
    } else if (!model.trainingLoaded) {
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
      classifierSlice.actions.setActiveModel({
        modelName: model.name,
        kindId: kindClassifier.kindId,
      }),
    );
  }, [
    kindClassifier,
    newModelName,
    activeItems,
    knownCategories,
    handleError,
    dispatch,
  ]);

  return fitClassifier;
};

export default useFitClassifier;
