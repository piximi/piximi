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
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { dataSliceV2 } from "store/dataV2";
import type { KindClassifier } from "store/classifier/types";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import { generateUUID } from "store/dataV2/utils";
import { diffCompileSettings } from "@ProjectViewer/sections/ModelTaskSection/ClassifierSection/FitClassifierDialog/panels/ModelSettings/HyperparameterSettings/settingsLock";

import { Partition } from "utils/dl/enums";
import {
  applySplitAndShuffle,
  fingerprintDataset,
  hashCategorySet,
  partitionTrainingData,
} from "utils/dl/classification/utils";
import { toTrainingInput } from "utils/dl/utils";
import type { TrainingInput } from "utils/dl/types";
import type {
  ModelInfo,
  ModelClassMap,
  Run,
  RunTrigger,
  TrainingCallbacks,
  ModelInfoDTO,
} from "utils/dl/classification/types";
import { useClassifierApi } from "utils/dl/classification";

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
    modelTarget,
  );
  const knownCategories = useSelector(selectActiveKnownCategories);

  // HOOKS
  const { setTotalEpochs } = useClassifierHistory();
  const { newModelName, modelParams, userDefinedSeed } = useClassifierStatus();
  const { getClassMap } = useClassMapDialog();
  const handleError = useClassifierErrorHandler();
  const cfApi = useClassifierApi();

  const dispatchPartition = useMemo(
    () =>
      kindClassifier.modelTargetId === IMAGE_CLASSIFIER_ID
        ? dataSliceV2.actions.batchUpdateImagePartition
        : dataSliceV2.actions.batchUpdateAnnotationPartition,
    [kindClassifier.modelTargetId],
  );
  const prepareInitialRun = async (
    kindClassifier: KindClassifier,
    modelInfo: ModelInfo,
  ) => {
    let model: ModelInfoDTO;
    let classMap: ModelClassMap | undefined;
    const seed = userDefinedSeed ?? Math.floor(Math.random() * 1000);

    try {
      const result = await cfApi.createNewModel(
        newModelName,
        kindClassifier.newModelArch,
        seed,
      );
      if (result.success) {
        model = result.data;
      } else {
        console.error(
          `[fitClassifier: ${newModelName}] ${result.reason.code}: ${result.reason.message}`,
          result.reason.cause,
        );
        throw new Error("ModelCreationError", { cause: result.reason.cause });
      }
      modelInfo.initSeed = seed;
      dispatch(
        classifierSlice.actions.addModelInfo({
          targetId: kindClassifier.modelTargetId,
          modelName: newModelName,
          modelInfo: modelInfo,
        }),
      );
      dispatch(
        classifierSlice.actions.setActiveModel({
          targetId: kindClassifier.modelTargetId,
          modelName: newModelName,
        }),
      );

      classMap = knownCategories.reduce((map: ModelClassMap, category, idx) => {
        map[idx] = category.id;
        return map;
      }, {});
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          targetId: kindClassifier.modelTargetId,
          modelName: model.name,
          classMapping: classMap,
        }),
      );
    } catch (error) {
      throw new Error("Model Generation Error", { cause: error });
    }

    const { inference, labeledTraining, labeledUnassigned, labeledValidation } =
      partitionTrainingData(activeItems.map((item) => toTrainingInput(item)));

    const { splitTrainingItems, splitValidationItems } = applySplitAndShuffle(
      labeledUnassigned,
      modelInfo.preprocessSettings.trainingPercentage,
      modelInfo.preprocessSettings.shuffle
        ? { shuffle: true, seed: seed }
        : { shuffle: false },
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
      const result = await cfApi.prepareModel(
        model.name,
        trainingData,
        validationData,
        knownCategories.length,
        knownCategories,
        modelInfo.preprocessSettings,
        modelInfo.optimizerSettings,
        seed,
      );
      if (!result.success) {
        throw new Error(
          `[prepareContinuedRun: prepareModel] ${result.reason.code}: ${result.reason.message}`,
          { cause: result.reason.cause },
        );
      }
    } catch (error) {
      throw new Error("Model Preparation Error", { cause: error });
    }

    return {
      modelName: model.name,
      classMap,
      trainingData,
      validationData,
      partitionUpdates,
      seed,
    };
  };

  const prepareContinuedRun = async (
    kindClassifier: KindClassifier,
    modelInfo: ModelInfo,
    modelName: string,
  ) => {
    let model: ModelInfoDTO;
    let classMap = modelInfo.classMap;
    const seed = userDefinedSeed ?? Math.floor(Math.random() * 1000);

    try {
      const result = await cfApi.getModelInfo(modelName);
      if (result.success) {
        model = result.data;
      } else {
        console.error(
          `[fitClassifier: ${modelName}] ${result.reason.code}: ${result.reason.message}`,
          result.reason.cause,
        );
        throw new Error("ModelRetrievalError", { cause: result.reason.cause });
      }
    } catch (error) {
      throw new Error("Model Generation Error", {
        cause: error,
      });
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
          targetId: kindClassifier.modelTargetId,
          modelName: model.name,
          classMapping: classMap,
        }),
      );
    }
    const { inference, labeledTraining, labeledUnassigned, labeledValidation } =
      partitionTrainingData(activeItems.map((item) => toTrainingInput(item)));
    const trainingData = [...labeledTraining, ...labeledUnassigned];
    const validationData = labeledValidation;
    assertTrainable(trainingData, validationData);
    const { trainingUpdates, validationUpdates, inferenceUpdates } =
      buildStoreUpdates({
        toTrainingPartition: labeledUnassigned,
        toValidationPartition: [],
        toInferencePartition: inference,
      });
    const partitionUpdates = [
      ...trainingUpdates,
      ...validationUpdates,
      ...inferenceUpdates,
    ];
    const lastRun = modelInfo.runs.findLast((r) => r.status !== "in-progress");
    // computation duplicated later in `buildInProgressRun`, but cheap enough and avoids
    // excessive parameter-threading and uneccessary/unused computation in `prepareInitialRun`
    const { trainingFingerprint, validationFingerprint } =
      await fingerprintDataset(trainingData, validationData);
    const trainingChanged =
      trainingFingerprint !== lastRun?.trainingFingerprint;
    const validationChanged =
      validationFingerprint !== lastRun?.validationFingerprint;
    const classes = Object.values(classMap).map((id) => ({ id }));

    const optimizerDiff = diffCompileSettings(
      lastRun?.hyperparameters.optimizer,
      modelInfo.optimizerSettings,
    );
    if (optimizerDiff.changed) {
      const result = await cfApi.recompile(
        model.name,
        modelInfo.optimizerSettings,
      );
      if (!result.success) {
        throw new Error(
          `[prepareContinuedRun: recompile] ${result.reason.code}: ${result.reason.message}`,
          { cause: result.reason.cause },
        );
      }
    }

    if (!model.trainingLoaded) {
      const result = await cfApi.loadData(
        model.name,
        trainingData,
        validationData,
        classes,
        seed,
      );
      if (!result.success) {
        throw new Error(
          `[prepareContinuedRun: loadData] ${result.reason.code}: ${result.reason.message}`,
          { cause: result.reason.cause },
        );
      }
    } else if (trainingChanged && validationChanged) {
      const result = await cfApi.loadData(
        model.name,
        trainingData,
        validationData,
        classes,
        seed,
      );
      if (!result.success) {
        throw new Error(
          `[prepareContinuedRun: loadData] ${result.reason.code}: ${result.reason.message}`,
          { cause: result.reason.cause },
        );
      }
    } else if (trainingChanged) {
      const result = await cfApi.loadTraining(
        model.name,
        trainingData,
        classes,
        seed,
      );
      if (!result.success) {
        throw new Error(
          `[prepareContinuedRun: loadTraining] ${result.reason.code}: ${result.reason.message}`,
          { cause: result.reason.cause },
        );
      }
    } else if (validationChanged) {
      const result = await cfApi.loadValidation(
        model.name,
        validationData,
        classes,
        seed,
      );
      if (!result.success) {
        throw new Error(
          `[prepareContinuedRun: loadValidation] ${result.reason.code}: ${result.reason.message}`,
          { cause: result.reason.cause },
        );
      }
    }

    return {
      modelName: model.name,
      classMap,
      trainingData,
      validationData,
      partitionUpdates,
      seed,
    };
  };

  const buildInProgressRun = async ({
    modelInfo,
    trainingData,
    validationData,
    isInit,
    startedAt,
    classMap,
    seed,
  }: {
    modelInfo: ModelInfo;
    trainingData: TrainingInput[];
    validationData: TrainingInput[];
    isInit: boolean;
    startedAt: string;
    classMap: ModelClassMap;
    seed: number;
  }): Promise<Run> => {
    const datasetFingerprint = await fingerprintDataset(
      trainingData,
      validationData,
    );
    const currentCategoryIds = knownCategories.map((c) => c.id);
    const categorySetHash = await hashCategorySet(currentCategoryIds);
    // Skip any orphaned in-progress run from a prior crash when locating the
    // parent — `at(-1)` would otherwise point at the orphan.
    const parentRun = modelInfo.runs.findLast(
      (r) => r.status !== "in-progress",
    );
    const parentRunId = parentRun?.id;

    const trainingIdSet = new Set(trainingData.map((d) => d.id));
    const hasHitlCorrections = activeItems.some(
      (item) =>
        trainingIdSet.has(item.id) &&
        item.predictionCorrected?.correctedFromRunId === parentRun?.id,
    );
    const trigger: RunTrigger = isInit
      ? "fresh"
      : hasHitlCorrections
        ? "hitl-correction"
        : "continue";

    return {
      id: generateUUID(),
      parentRunId,
      startedAt,
      trigger,
      seed,
      status: "in-progress",
      appVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
      tfjsVersion: version_core,
      backend: getBackend(),
      hyperparameters: {
        architecture: kindClassifier.newModelArch,
        optimizer: structuredClone(modelInfo.optimizerSettings),
        preprocess: structuredClone(modelInfo.preprocessSettings),
      },
      classMap,
      ...datasetFingerprint,
      valIds: validationData.map((d) => d.id),
      categorySetHash,
      history: [],
    };
  };

  const fitClassifier = useCallback(async () => {
    if (!kindClassifier) return;
    const startedAt = new Date().toISOString();
    const modelName = kindClassifier.activeModel;
    const modelInfo: ModelInfo = modelName
      ? kindClassifier?.modelInfoDict[modelName]
      : {
          ...deepClone(modelParams),
          confidenceThreshold: 0.5,
          runs: [],
          valid: true,
        };

    const currentModelEpochs = modelInfo.runs.reduce((total: number, run) => {
      const runEpochs = run.hyperparameters.optimizer.epochs;
      return (total += runEpochs);
    }, 0);
    setTotalEpochs(currentModelEpochs + modelInfo.optimizerSettings.epochs);
    // An invalid model means categories changed — a new model must be created.
    // Forcing initFit here ensures we never try to continue training an output
    // layer whose size no longer matches the current category set.

    let initializedModelName: string;
    let classMap: ModelClassMap;
    let trainingData: TrainingInput[];
    let validationData: TrainingInput[];
    let partitionUpdates: Array<{ id: string; partition: Partition }>;
    let seed: number;

    dispatch(
      classifierSlice.actions.setModelStatus({
        targetId: modelTarget,
        status: "loading",
      }),
    );
    // modelInfo.valid === false should never actually happen here
    // since this is guarded against before hitting fit
    const isInit = !modelName || !modelInfo.valid;
    try {
      ({
        modelName: initializedModelName,
        classMap,
        trainingData,
        validationData,
        partitionUpdates,
        seed,
      } = isInit
        ? await prepareInitialRun(kindClassifier, modelInfo)
        : await prepareContinuedRun(kindClassifier, modelInfo, modelName));
    } catch (error) {
      handleError(error as Error, "Data Preparation Error");
      return;
    }
    dispatch(dispatchPartition(partitionUpdates));

    const inProgressRun = await buildInProgressRun({
      modelInfo,
      trainingData,
      validationData,
      isInit,
      startedAt,
      classMap,
      seed,
    });
    dispatch(
      classifierSlice.actions.appendRun({
        targetId: modelTarget,
        modelName: initializedModelName,
        run: inProgressRun,
      }),
    );
    dispatch(
      classifierSlice.actions.setModelStatus({
        targetId: modelTarget,
        status: "training",
      }),
    );

    const onEpochEnd: TrainingCallbacks["onEpochEnd"] = async (epoch, logs) => {
      if (
        !logs ||
        logs.categoricalAccuracy === undefined ||
        logs.val_categoricalAccuracy === undefined ||
        logs.loss === undefined ||
        logs.val_loss === undefined
      )
        return;
      dispatch(
        classifierSlice.actions.appendEpochToActiveRun({
          targetId: modelTarget,
          modelName: initializedModelName,
          epoch: {
            epoch,
            loss: logs.loss as number,
            valLoss: logs.val_loss as number,
            accuracy: logs.categoricalAccuracy as number,
            valAccuracy: logs.val_categoricalAccuracy as number,
          },
        }),
      );
    };
    try {
      const trainingResults = await cfApi.train(
        initializedModelName,
        modelInfo.optimizerSettings,
        { onEpochEnd },
      );
      if (trainingResults.success) {
        dispatch(
          classifierSlice.actions.finalizeActiveRun({
            targetId: modelTarget,
            modelName: initializedModelName,
            finishedAt: new Date().toISOString(),
            status: trainingResults.data.status,
            evalResults: trainingResults.data.evalResults,
            weightsRef: trainingResults.data.weightsRef,
          }),
        );
        dispatch(
          classifierSlice.actions.setModelTrained({
            targetId: modelTarget,
            modelName: initializedModelName,
          }),
        );
      } else {
        console.error(
          `[fitClassifier: ${initializedModelName}] ${trainingResults.reason.code}: ${trainingResults.reason.message}`,
          trainingResults.reason.cause,
        );
        throw new Error("ModelTrainingError", {
          cause: trainingResults.reason.cause,
        });
      }
    } catch (error) {
      dispatch(
        classifierSlice.actions.finalizeActiveRun({
          targetId: modelTarget,
          modelName: initializedModelName,
          finishedAt: new Date().toISOString(),
          status: "failed",
        }),
      );
      handleError(error as Error, "Training Error");
    }
  }, [
    kindClassifier,
    newModelName,
    activeItems,
    knownCategories,
    handleError,
    dispatch,
    modelParams,
  ]);

  return fitClassifier;
};

export default useFitClassifier;
