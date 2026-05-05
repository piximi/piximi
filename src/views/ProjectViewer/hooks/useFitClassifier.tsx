import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { getBackend, version_core } from "@tensorflow/tfjs";

import { deepClone } from "@mui/x-data-grid/internals";

import { classifierSlice } from "store/classifier";
import {
  selectActiveItems,
  selectActiveKnownCategories,
} from "@ProjectViewer/state/reselectors";
import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import {
  BASE_MODEL_NAME,
  IMAGE_CLASSIFIER_ID,
} from "store/classifier/constants";
import { dataSliceV2 } from "store/dataV2";
import type {
  CategoryDelta,
  KindClassifier,
  ModelClassMap,
  ModelInfo,
  Run,
  RunTrigger,
} from "store/classifier/types";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import { generateUUID } from "store/dataV2/utils";

import classifierHandler from "utils/dl/classification/classifierHandler";
import { ModelStatus, Partition } from "utils/dl/enums";
import type { SequentialClassifier } from "utils/dl/classification";
import {
  applySplitAndShuffle,
  partitionTrainingData,
} from "utils/dl/classification/utils";
import {
  fingerprintDataset,
  hashCategorySet,
  toTrainingInput,
} from "utils/dl/utils";
import type { TrainAndEvalResult, TrainingInput } from "utils/dl/types";
import { getDifferences } from "utils/arrayUtils";

import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";
import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

const buildStoreUpdates = ({
  toTrainingPartition,
  toValidationPartition,
  toInferencePartition,
}: {
  toTrainingPartition: TrainingInput[];
  toValidationPartition: TrainingInput[];
  toInferencePartition: TrainingInput[];
}) => {
  const trainingUpdates = toTrainingPartition.map((item) => ({
    id: item.id,
    partition: Partition.Training,
  }));
  const validationUpdates = toValidationPartition.map((item) => ({
    id: item.id,
    partition: Partition.Validation,
  }));
  const inferenceUpdates = toInferencePartition.map((item) => ({
    id: item.id,
    partition: Partition.Inference,
  }));
  return { trainingUpdates, validationUpdates, inferenceUpdates };
};

const assertTrainable = (
  trainingData: TrainingInput[],
  validationData: TrainingInput[],
) => {
  if (trainingData.length === 0 || validationData.length === 0) {
    throw new Error(
      `Cannot train: need at least one training and one validation item ` +
        `(got ${trainingData.length} training, ${validationData.length} validation). ` +
        `Label more items or adjust the training percentage.`,
    );
  }
};

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

  const dispatchPartition = useMemo(
    () =>
      kindClassifier.kindId === IMAGE_CLASSIFIER_ID
        ? dataSliceV2.actions.batchUpdateImagePartition
        : dataSliceV2.actions.batchUpdateAnnotationPartition,
    [kindClassifier.kindId],
  );
  const prepareInitialRun = async (
    kindClassifier: KindClassifier,
    modelInfo: ModelInfo,
  ) => {
    let model: SequentialClassifier;
    let classMap: ModelClassMap | undefined;
    try {
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

      classMap = knownCategories.reduce((map: ModelClassMap, category, idx) => {
        map[idx] = category.id;
        return map;
      }, {});
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          kindId: kindClassifier.kindId,
          modelName: model.name,
          classMapping: classMap,
        }),
      );
    } catch (error) {
      throw new Error("Model Generation Error", { cause: error });
    }

    const { inference, labeledTraining, labeledUnassigned, labeledValidation } =
      partitionTrainingData(activeItems.map(toTrainingInput));
    const { splitTrainingItems, splitValidationItems } = applySplitAndShuffle(
      labeledUnassigned,
      modelInfo.preprocessSettings.trainingPercentage,
      modelInfo.preprocessSettings.shuffle,
    );
    const trainingData = [...labeledTraining, ...splitTrainingItems];
    const validationData = [...labeledValidation, ...splitValidationItems];
    assertTrainable(trainingData, validationData);

    const { trainingUpdates, validationUpdates, inferenceUpdates } =
      buildStoreUpdates({
        toTrainingPartition: splitTrainingItems,
        toValidationPartition: splitValidationItems,
        toInferencePartition: inference,
      });

    const partitionUpdates: Array<{ id: string; partition: Partition }> = [
      ...trainingUpdates,
      ...validationUpdates,
      ...inferenceUpdates,
    ];
    try {
      await classifierHandler.prepareModel(
        model.name,
        trainingData,
        validationData,
        knownCategories.length,
        knownCategories,
        modelInfo.preprocessSettings,
        modelInfo.optimizerSettings,
      );
    } catch (error) {
      throw new Error("Model Preparation Error", { cause: error });
    }

    return {
      modelName: model.name,
      trigger: "fresh" as RunTrigger,
      parentRunId: undefined,
      categoryDelta: undefined,
      classMap,
      trainingData,
      validationData,
      partitionUpdates,
    };
  };

  const prepareContinuedRun = async (
    kindClassifier: KindClassifier,
    modelInfo: ModelInfo,
    modelName: string,
  ) => {
    let model: SequentialClassifier;
    let classMap = modelInfo.classMap;
    try {
      model = classifierHandler.getModel(modelName);
    } catch (error) {
      throw new Error("Model Generation Error", { cause: error });
    }

    // if the class map is not set, we need to get it from the user
    if (!classMap) {
      const setMapping = await getClassMap({
        projectCategories: knownCategories,
        modelClasses: model.classes,
      });

      if (!setMapping) throw new Error("Class mapping needed for training");

      classMap = setMapping as ModelClassMap;
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          kindId: kindClassifier.kindId,
          modelName: model.name,
          classMapping: classMap,
        }),
      );
    }
    const { inference, labeledTraining, labeledUnassigned, labeledValidation } =
      partitionTrainingData(activeItems.map(toTrainingInput));
    const trainingData = [...labeledTraining, ...labeledUnassigned];
    const validationData = labeledValidation;
    assertTrainable(trainingData, validationData);
    const { trainingUpdates, validationUpdates, inferenceUpdates } =
      buildStoreUpdates({
        toTrainingPartition: labeledUnassigned,
        toValidationPartition: [],
        toInferencePartition: inference,
      });
    let partitionUpdates: Array<{ id: string; partition: Partition }> = [];
    if (!model.trainingLoaded) {
      partitionUpdates = [
        ...trainingUpdates,
        ...validationUpdates,
        ...inferenceUpdates,
      ];

      classifierHandler.loadData(
        model.name,
        trainingData,
        validationData,
        Object.values(classMap).map((id) => ({ id })),
      );
    } else {
      if (labeledUnassigned.length > 0) {
        classifierHandler.loadTraining(
          model.name,
          labeledUnassigned,
          Object.values(classMap).map((id) => ({ id })),
        );
        partitionUpdates = trainingUpdates;
      }
    }

    return {
      modelName: model.name,
      classMap,
      trainingData,
      validationData,
      partitionUpdates,
    };
  };

  const recordRun = async ({
    modelName,
    modelInfo,
    trainingData,
    validationData,
    isInit,
    startedAt,
    classMap,
    trainingResults,
  }: {
    modelName: string;
    trainingData: TrainingInput[];
    validationData: TrainingInput[];
    modelInfo: ModelInfo;
    isInit: boolean;
    startedAt: string;
    classMap: ModelClassMap;
    trainingResults: TrainAndEvalResult;
  }) => {
    const datasetFingerprint = await fingerprintDataset(
      trainingData.map((d) => d.id),
      validationData.map((d) => d.id),
    );
    const currentCategoryIds = knownCategories.map((c) => c.id);
    const categorySetHash = await hashCategorySet(currentCategoryIds);
    const parentRun = modelInfo.runs.at(-1);

    const parentRunId = parentRun?.id;
    let categoryDelta: CategoryDelta | undefined = undefined;

    const trainingIds = new Set(trainingData.map((d) => d.id));
    const hasHitlCorrections = activeItems.some(
      (item) =>
        trainingIds.has(item.id) && item.predictedAtRunId === parentRun?.id,
    );
    const trigger: RunTrigger = isInit
      ? "fresh"
      : hasHitlCorrections
        ? "hitl-correction"
        : "continue";

    if (modelInfo.status === "invalid") {
      const parentCategoryIds = Object.values(parentRun?.classMap ?? {});
      categoryDelta = getDifferences(parentCategoryIds, currentCategoryIds);
    }
    const run: Run = {
      id: generateUUID(),
      parentRunId,
      startedAt,
      finishedAt: new Date().toISOString(),
      trigger,
      appVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
      tfjsVersion: version_core,
      backend: getBackend(),
      hyperparameters: {
        architecture: kindClassifier.newModelArch,
        optimizer: structuredClone(modelInfo.optimizerSettings),
        preprocess: structuredClone(modelInfo.preprocessSettings),
      },
      classMap: classMap!,
      datasetFingerprint,
      categorySetHash,
      categoryDelta,
      evalResults: trainingResults.evalResults,
      history: trainingResults.history,
      status: trainingResults.status,
      weightsRef: trainingResults.weightsRef,
    };

    dispatch(
      classifierSlice.actions.appendRun({
        kindId: modelTarget.id,
        modelName: modelName,
        run,
      }),
    );
    setModelStatus(ModelStatus.Idle);

    dispatch(
      classifierSlice.actions.setActiveModel({
        modelName: modelName,
        kindId: kindClassifier.kindId,
      }),
    );
  };

  const fitClassifier = useCallback(async () => {
    if (!kindClassifier) return;
    const startedAt = new Date().toISOString();
    const modelName = kindClassifier.activeModel;
    const modelInfo =
      kindClassifier?.modelInfoDict[modelName ?? BASE_MODEL_NAME];

    // updates the the total number of epochs the model will train for (for display purposes)
    setTotalEpochs(
      (totalEpochs) => totalEpochs + modelInfo.optimizerSettings.epochs,
    );
    // An invalid model means categories changed — a new model must be created.
    // Forcing initFit here ensures we never try to continue training an output
    // layer whose size no longer matches the current category set.

    let initializedModelName: string;
    let classMap: ModelClassMap;
    let trainingData: TrainingInput[];
    let validationData: TrainingInput[];
    let partitionUpdates: Array<{ id: string; partition: Partition }>;

    setModelStatus(ModelStatus.Loading);
    const isInit = !modelName || modelInfo.status === "invalid";
    try {
      ({
        modelName: initializedModelName,
        classMap,
        trainingData,
        validationData,
        partitionUpdates,
      } = isInit
        ? await prepareInitialRun(kindClassifier, modelInfo)
        : await prepareContinuedRun(kindClassifier, modelInfo, modelName));
    } catch (error) {
      handleError(error as Error, "Data Preparation Error");
      return;
    }
    dispatch(dispatchPartition(partitionUpdates));
    setModelStatus(ModelStatus.Training);

    const trainingResults = await classifierHandler.train(
      initializedModelName,
      modelInfo.optimizerSettings,
      {
        onEpochEnd: epochEndCallback,
      },
    );

    await recordRun({
      modelName: initializedModelName,
      trainingData,
      validationData,
      modelInfo,
      isInit,
      classMap,
      startedAt,
      trainingResults,
    });
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
