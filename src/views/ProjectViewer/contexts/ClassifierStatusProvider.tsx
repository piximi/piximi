import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useSelector } from "react-redux";

import { useImmer } from "use-immer";

import { useBackend } from "core/backend";
import { Partition } from "core/dl/enums";
import { ARCHITECTURE_LABELS } from "core/dl/classification/types";
import { getDefaultModelParams } from "core/dl/classification/utils";
import { representsUnknown, type Shape } from "core/entities";

import {
  selectActiveClassifier,
  selectActiveModelName,
  selectAllCreatedModelNames,
  selectIsModelTrained,
  selectModelIsValid,
  selectModelLifecycleStatus,
  selectModelOptimizerSettings,
  selectModelPreprocessSettings,
  selectModelTargetName,
  selectNewModelArch,
} from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectShowClearPredictionsWarning } from "store/applicationSettings/selectors";
import { selectVisibleChannelCount } from "store/data/selectors";

import { recursiveAssign } from "utils/objectUtils";
import { getUniqueName } from "utils/stringUtils";

import { useClassificationModel } from "@ProjectViewer/hooks/useClassificationModel";
import {
  selectActiveLabeledItems,
  selectActiveItemsByPartition,
  selectActiveKnownCategories,
} from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import type React from "react";

import type {
  ClassifierModelParams,
  ModelLifecycleStatus,
  OptimizerSettings,
  PreprocessSettings,
} from "core/dl/classification/types";

import type { RecursivePartial } from "utils/types";

export enum ErrorReason {
  NotTrainable,
  NoLabeledImages,
  TooFewCategories,
  TooFewLabeledCategories,
  ExistingPredictions,
  ChannelMismatch,
  DuplicateModelName,
  Invalid,
}

type Precheck = {
  modelTrainable: boolean; // success -> true
  modelValid: boolean; // success -> true
  labeledImages: boolean; // success -> true
  multipleCategories: boolean; // success -> true
  multipleLabeledCategories: boolean; // success -> true
  noPendingPredictions: boolean; // success -> true
  channelsValid: boolean; // success -> true
  modelNameValid: boolean; // success -> true
};

type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

type ClassifierStateContextProp = {
  isReady: boolean;
  precheck: Precheck;
  shouldWarnClearPredictions: boolean;
  modelIsTrained: boolean;
  classifierStatus: ModelLifecycleStatus;
  error?: ErrorContext;
  activeErrors: ErrorContext[];
  newModelName: string;
  setNewModelName: (name: string | null) => void;
  modelParams: ClassifierModelParams;
  handleUpdateOptimizerSettings: (settings: Partial<OptimizerSettings>) => void;
  handleUpdatePreprocessSettings: (
    settings: RecursivePartial<PreprocessSettings>,
  ) => void;
  handleUpdateInputShape: (settings: Partial<Shape>) => void;
  userDefinedSeed: number | undefined;
  setUserDefinedSeed: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const ClassifierStatusContext = createContext<ClassifierStateContextProp>({
  isReady: true,
  precheck: {
    modelTrainable: false,
    modelValid: false,
    labeledImages: false,
    multipleCategories: false,
    multipleLabeledCategories: false,
    noPendingPredictions: false,
    channelsValid: false,
    modelNameValid: false,
  },
  shouldWarnClearPredictions: false,
  modelIsTrained: false,
  classifierStatus: "idle",
  newModelName: "",
  setNewModelName: () => {},
  activeErrors: [],
  modelParams: getDefaultModelParams(),
  handleUpdateOptimizerSettings: () => {},
  handleUpdatePreprocessSettings: () => {},
  handleUpdateInputShape: () => {},
  userDefinedSeed: undefined,
  setUserDefinedSeed: (_value: React.SetStateAction<number | undefined>) => {},
});

const useModelParams = () => {
  const backend = useBackend();
  const visibleChannels = useSelector(selectVisibleChannelCount);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const activeClassifier = useParameterizedSelector(
    selectActiveClassifier,
    modelTarget,
  );
  const restrictedClassifierNames = useSelector(selectAllCreatedModelNames);
  const activeModelName = useParameterizedSelector(
    selectActiveModelName,
    modelTarget,
  );
  const modelTargetName = useParameterizedSelector(
    selectModelTargetName,
    modelTarget,
  );
  const newModelArch = useParameterizedSelector(
    selectNewModelArch,
    modelTarget,
  );

  const modelPreprocessingSettings = useParameterizedSelector(
    selectModelPreprocessSettings,
    modelTarget,
  );
  const modelOptimizerSettings = useParameterizedSelector(
    selectModelOptimizerSettings,
    modelTarget,
  );

  const [userDefinedSeed, setUserDefinedSeed] = useState<number | undefined>();
  const suggestedModelName = useMemo(
    () =>
      getUniqueName(
        `${modelTargetName}_${ARCHITECTURE_LABELS[newModelArch] ?? newModelArch}`,
        restrictedClassifierNames,
        (base, n) => `${base}${n}`,
      ),
    [modelTargetName, newModelArch, restrictedClassifierNames],
  );

  const [userModelName, setUserModelName] = useState<string | null>(null);
  // Forget a custom name once a model is created or selected, as today's remount does.
  const [prevActive, setPrevActive] = useState(activeModelName);
  if (activeModelName !== prevActive) {
    setPrevActive(activeModelName);
    setUserModelName(null);
  }
  const newModelName = userModelName ?? suggestedModelName;

  const [newModelParams, updateNewModelParams] = useImmer(
    getDefaultModelParams(visibleChannels || undefined),
  );
  const hasModelSettings =
    !!modelPreprocessingSettings && !!modelOptimizerSettings;
  const [paramsKey, setParamsKey] = useState({
    hasModelSettings,
    visibleChannels,
  });
  if (
    paramsKey.hasModelSettings !== hasModelSettings ||
    paramsKey.visibleChannels !== visibleChannels
  ) {
    setParamsKey({ hasModelSettings, visibleChannels });
    updateNewModelParams(() => getDefaultModelParams(visibleChannels));
  }
  const modelParams = useMemo(() => {
    if (modelPreprocessingSettings && modelOptimizerSettings)
      return {
        preprocessSettings: modelPreprocessingSettings,
        optimizerSettings: modelOptimizerSettings,
      };
    return newModelParams;
  }, [modelPreprocessingSettings, modelOptimizerSettings, newModelParams]);

  // An existing classifier's settings belong to the backend; a new one's
  // are a draft here until it is created.
  const updateExisting = useCallback(
    (change: (draft: ClassifierModelParams) => void) => {
      if (!activeClassifier || !backend.classification) return;
      const draft: ClassifierModelParams = {
        preprocessSettings: structuredClone(
          activeClassifier.hyperparameters.preprocess,
        ),
        optimizerSettings: structuredClone(
          activeClassifier.hyperparameters.optimizer,
        ),
      };
      change(draft);
      backend.classification
        .update({
          classifierId: activeClassifier.id,
          hyperparameters: {
            preprocess: draft.preprocessSettings,
            optimizer: draft.optimizerSettings,
          },
        })
        .catch((error: unknown) =>
          console.error("[ClassifierStatusProvider] update", error),
        );
    },
    [activeClassifier, backend],
  );
  const handleUpdateOptimizerSettings = useCallback(
    (settings: Partial<OptimizerSettings>) => {
      const change = (draft: ClassifierModelParams) => {
        Object.assign(draft.optimizerSettings, settings);
      };
      if (modelOptimizerSettings) updateExisting(change);
      else updateNewModelParams(change);
    },
    [modelOptimizerSettings, updateExisting, updateNewModelParams],
  );
  const handleUpdatePreprocessSettings = useCallback(
    (settings: RecursivePartial<PreprocessSettings>) => {
      const change = (draft: ClassifierModelParams) => {
        recursiveAssign(draft.preprocessSettings, settings);
      };
      if (modelPreprocessingSettings) updateExisting(change);
      else updateNewModelParams(change);
    },
    [modelPreprocessingSettings, updateExisting, updateNewModelParams],
  );
  const handleUpdateInputShape = useCallback(
    (inputShape: Partial<Shape>) => {
      const change = (draft: ClassifierModelParams) => {
        Object.assign(draft.preprocessSettings.inputShape, inputShape);
      };
      if (modelPreprocessingSettings) updateExisting(change);
      else updateNewModelParams(change);
    },
    [modelPreprocessingSettings, updateExisting, updateNewModelParams],
  );
  return {
    modelParams,
    newModelName,
    setNewModelName: setUserModelName,
    userDefinedSeed,
    setUserDefinedSeed,
    handleUpdateOptimizerSettings,
    handleUpdatePreprocessSettings,
    handleUpdateInputShape,
    restrictedClassifierNames,
  };
};

export const ClassifierStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelConfig = useClassificationModel();
  const modelIsValid = useParameterizedSelector(
    selectModelIsValid,
    modelTarget,
  );
  const inferenceItems = useParameterizedSelector(
    selectActiveItemsByPartition,
    Partition.Inference,
  );
  const modelIsTrained = useParameterizedSelector(
    selectIsModelTrained,
    modelTarget,
  );
  const classifierStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const activeLabeledItems = useSelector(selectActiveLabeledItems);
  const knownCategories = useSelector(selectActiveKnownCategories);
  // Categories that will actually reach training. Labeled items in the
  // inference partition are predictions, which `partitionTrainingData` drops.
  const labeledCategoryCount = useMemo(
    () =>
      new Set(
        activeLabeledItems
          .filter((item) => item.partition !== Partition.Inference)
          .map((item) => item.categoryId),
      ).size,
    [activeLabeledItems],
  );
  const visibleChannels = useSelector(selectVisibleChannelCount);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );

  const {
    modelParams,
    newModelName,
    setNewModelName,
    userDefinedSeed,
    setUserDefinedSeed,
    handleUpdateOptimizerSettings,
    handleUpdatePreprocessSettings,
    handleUpdateInputShape,
    restrictedClassifierNames,
  } = useModelParams();

  const isFitting =
    classifierStatus === "loading" || classifierStatus === "training";

  const modelChannels = useMemo(
    () =>
      modelConfig?.hyperparameters.preprocess.inputShape.channels ??
      modelParams.preprocessSettings.inputShape.channels,
    [modelConfig?.hyperparameters, modelParams],
  );
  const precheck: Precheck = useMemo(
    () => ({
      modelTrainable: !modelConfig || modelConfig.trainable,
      modelValid: modelIsValid === undefined ? true : modelIsValid,
      labeledImages: activeLabeledItems.length > 0,
      // A classifier needs at least two output classes to learn anything.
      multipleCategories: knownCategories.length >= 2,
      multipleLabeledCategories: labeledCategoryCount >= 2,
      noPendingPredictions: inferenceItems.every((item) =>
        representsUnknown(item.categoryId),
      ),
      channelsValid:
        modelChannels && visibleChannels
          ? visibleChannels === modelChannels
          : true,
      modelNameValid:
        !!modelConfig ||
        isFitting ||
        !restrictedClassifierNames.includes(newModelName),
    }),
    [
      modelConfig,
      visibleChannels,
      newModelName,
      restrictedClassifierNames,
      modelIsValid,
      activeLabeledItems,
      knownCategories,
      labeledCategoryCount,
      isFitting,
      inferenceItems,
      modelChannels,
    ],
  );

  const isReady = useMemo(
    () => Object.values(precheck).every((b) => b),
    [precheck],
  );

  const shouldWarnClearPredictions = useMemo(() => {
    return showClearPredictionsWarning && !precheck.noPendingPredictions;
  }, [showClearPredictionsWarning, precheck.noPendingPredictions]);

  const activeErrors = useMemo(() => {
    const newErrors: ErrorContext[] = [];

    if (!precheck.modelTrainable) {
      newErrors.push({
        reason: ErrorReason.NotTrainable,
        message: "Selected model is not trainable.",
        severity: 1,
      });
    }
    if (!precheck.labeledImages) {
      newErrors.push({
        reason: ErrorReason.NoLabeledImages,
        message: "Please label images to train a model.",
        severity: 3,
      });
    }
    if (!precheck.multipleCategories) {
      newErrors.push({
        reason: ErrorReason.TooFewCategories,
        message: "Create at least two categories to train a classifier.",
        severity: 2,
      });
    } else if (precheck.labeledImages && !precheck.multipleLabeledCategories) {
      newErrors.push({
        reason: ErrorReason.TooFewLabeledCategories,
        message:
          "Label items in at least two categories to train a classifier.",
        severity: 3,
      });
    }
    if (!precheck.channelsValid) {
      newErrors.push({
        reason: ErrorReason.ChannelMismatch,
        message: `The model expects ${modelChannels} input channels, but ${visibleChannels} ${visibleChannels === 1 ? "channel is" : "channels are"} visible. Only visible channels are used: show or hide channels to match, or change the input shape.`,
        severity: 2,
      });
    }
    if (!precheck.modelNameValid) {
      newErrors.push({
        reason: ErrorReason.DuplicateModelName,
        message: `A model with the name ${newModelName} already exists`,
        severity: 1,
      });
    }

    if (!precheck.modelValid) {
      newErrors.push({
        reason: ErrorReason.Invalid,
        message: `Categories have changed since last training run`,
        severity: 3,
      });
    }

    return newErrors;
  }, [precheck, visibleChannels, newModelName, modelChannels]);

  const error = useMemo(
    () =>
      activeErrors.length === 0
        ? undefined
        : activeErrors.reduce((prev, curr) =>
            curr.severity < prev.severity ? curr : prev,
          ),
    [activeErrors],
  );

  const value = useMemo(
    () => ({
      isReady,
      precheck,
      shouldWarnClearPredictions,
      modelIsTrained,
      classifierStatus,
      error,
      newModelName,
      setNewModelName,
      activeErrors,
      modelParams,
      handleUpdateOptimizerSettings,
      handleUpdatePreprocessSettings,
      handleUpdateInputShape,
      userDefinedSeed,
      setUserDefinedSeed,
    }),
    [
      isReady,
      precheck,
      shouldWarnClearPredictions,
      error,
      newModelName,
      setNewModelName,
      activeErrors,
      modelParams,
      handleUpdateOptimizerSettings,
      handleUpdatePreprocessSettings,
      handleUpdateInputShape,
      userDefinedSeed,
      setUserDefinedSeed,
      classifierStatus,
      modelIsTrained,
    ],
  );

  return (
    <ClassifierStatusContext.Provider value={value}>
      {children}
    </ClassifierStatusContext.Provider>
  );
};

export const useClassifierStatus = () => {
  return useContext(ClassifierStatusContext);
};
