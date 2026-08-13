import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import { useImmer } from "use-immer";

import { useClassificationModel } from "hooks";

import {
  selectAllCreatedModelNames,
  selectIsModelTrained,
  selectModelIsValid,
  selectModelLifecycleStatus,
  selectModelOptimizerSettings,
  selectModelPreprocessSettings,
} from "store/classifier/selectors";
import {
  selectActiveLabeledItems,
  selectActiveItemsByPartition,
} from "@ProjectViewer/state/reselectors";
import {
  selectProjectImageChannels,
  selectActiveClassifierModelTarget,
} from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectShowClearPredictionsWarning } from "store/applicationSettings/selectors";
import type { Shape } from "store/data/types";
import { classifierSlice } from "store/classifier";

import { Partition } from "utils/dl/enums";
import { findReplicateName, representsUnknown } from "utils/stringUtils";
import { getDefaultModelParams } from "utils/dl/classification/utils";
import type {
  ClassifierModelParams,
  ModelLifecycleStatus,
  OptimizerSettings,
  PreprocessSettings,
} from "utils/dl/classification/types";
import type { RecursivePartial } from "utils/types";

export enum ErrorReason {
  NotTrainable,
  NoLabeledImages,
  ExistingPredictions,
  ChannelMismatch,
  DuplicateModelName,
  Invalid,
}

type Precheck = {
  modelTrainable: boolean; // success -> true
  modelValid: boolean; // success -> true
  labeledImages: boolean; // success -> true
  noPendingPredictions: boolean; // success -> true
  channelsValid: boolean; // success -> true
  modelNameValid: boolean; // success -> true
};

export type ErrorContext = {
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
  setNewModelName: React.Dispatch<React.SetStateAction<string>>;
  modelParams: ClassifierModelParams;
  handleUpdateOptimizerSettings: (settings: Partial<OptimizerSettings>) => void;
  handleUpdatePreprocessSettings: (
    settings: RecursivePartial<PreprocessSettings>,
  ) => void;
  handleUpdateInputShape: (settings: Partial<Shape>) => void;
  handleSetModelParams: (params: ClassifierModelParams) => void;
  userDefinedSeed: number | undefined;
  setUserDefinedSeed: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const ClassifierStatusContext = createContext<ClassifierStateContextProp>({
  isReady: true,
  precheck: {
    modelTrainable: false,
    modelValid: false,
    labeledImages: false,
    noPendingPredictions: false,
    channelsValid: false,
    modelNameValid: false,
  },
  shouldWarnClearPredictions: false,
  modelIsTrained: false,
  classifierStatus: "idle",
  newModelName: "",
  setNewModelName: (_value: React.SetStateAction<string>) => {},
  activeErrors: [],
  modelParams: getDefaultModelParams(),
  handleUpdateOptimizerSettings: () => {},
  handleUpdatePreprocessSettings: () => {},
  handleUpdateInputShape: () => {},
  handleSetModelParams: () => {},
  userDefinedSeed: undefined,
  setUserDefinedSeed: (_value: React.SetStateAction<number | undefined>) => {},
});

const useModelParams = () => {
  const dispatch = useDispatch();
  const projectChannels = useSelector(selectProjectImageChannels);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelPreprocessingSettings = useParameterizedSelector(
    selectModelPreprocessSettings,
    modelTarget,
  );
  const modelOptimizerSettings = useParameterizedSelector(
    selectModelOptimizerSettings,
    modelTarget,
  );
  const [newModelName, setNewModelName] = useState("");
  const [userDefinedSeed, setUserDefinedSeed] = useState<number | undefined>();

  const [newModelParams, updateNewModelParams] = useImmer(
    getDefaultModelParams(projectChannels),
  );
  const modelParams = useMemo(() => {
    if (modelPreprocessingSettings && modelOptimizerSettings)
      return {
        preprocessSettings: modelPreprocessingSettings,
        optimizerSettings: modelOptimizerSettings,
      };
    return newModelParams;
  }, [modelPreprocessingSettings, modelOptimizerSettings, newModelParams]);

  const handleUpdateOptimizerSettings = useCallback(
    (settings: Partial<OptimizerSettings>) => {
      if (modelOptimizerSettings)
        dispatch(
          classifierSlice.actions.updateModelOptimizerSettings({
            settings,
            targetId: modelTarget,
          }),
        );
      else
        updateNewModelParams((draft) => {
          Object.assign(draft.optimizerSettings, settings);
        });
    },
    [modelOptimizerSettings, modelTarget],
  );
  const handleUpdatePreprocessSettings = useCallback(
    (settings: RecursivePartial<PreprocessSettings>) => {
      if (modelPreprocessingSettings)
        dispatch(
          classifierSlice.actions.updateModelPreprocessSettings({
            settings,
            targetId: modelTarget,
          }),
        );
      else
        updateNewModelParams((draft) => {
          Object.assign(draft.preprocessSettings, settings);
        });
    },
    [modelPreprocessingSettings, modelTarget],
  );
  const handleUpdateInputShape = useCallback(
    (inputShape: Partial<Shape>) => {
      if (modelPreprocessingSettings)
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape,
            targetId: modelTarget,
          }),
        );
      else
        updateNewModelParams((draft) => {
          Object.assign(draft.preprocessSettings.inputShape, inputShape);
        });
    },
    [modelPreprocessingSettings, modelTarget],
  );
  const handleSetModelParams = useCallback((params: ClassifierModelParams) => {
    updateNewModelParams(() => params);
  }, []);
  useEffect(() => {
    if (modelPreprocessingSettings && modelOptimizerSettings) {
      handleSetModelParams({
        preprocessSettings: modelPreprocessingSettings,
        optimizerSettings: modelOptimizerSettings,
      });
      return;
    }
    handleSetModelParams(getDefaultModelParams(projectChannels));
  }, [modelOptimizerSettings, modelPreprocessingSettings, projectChannels]);
  return {
    modelParams,
    newModelName,
    setNewModelName,
    userDefinedSeed,
    setUserDefinedSeed,
    handleUpdateOptimizerSettings,
    handleUpdatePreprocessSettings,
    handleUpdateInputShape,
    handleSetModelParams,
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
  const projectChannels = useSelector(selectProjectImageChannels);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const restrictedClassifierNames = useSelector(selectAllCreatedModelNames);

  const {
    modelParams,
    newModelName,
    setNewModelName,
    userDefinedSeed,
    setUserDefinedSeed,
    handleUpdateOptimizerSettings,
    handleUpdatePreprocessSettings,
    handleUpdateInputShape,
    handleSetModelParams,
  } = useModelParams();

  const precheck: Precheck = useMemo(
    () => ({
      modelTrainable: !modelConfig || modelConfig.trainable,
      modelValid: modelIsValid === undefined ? true : modelIsValid,
      labeledImages: activeLabeledItems.length > 0,
      noPendingPredictions: inferenceItems.every((item) =>
        representsUnknown(item.categoryId),
      ),
      channelsValid:
        modelConfig?.preprocessingSettings && projectChannels
          ? projectChannels !==
            modelConfig.preprocessingSettings.inputShape.channels
          : true,
      modelNameValid: !findReplicateName(
        newModelName,
        restrictedClassifierNames,
      ),
    }),
    [
      modelConfig,
      projectChannels,
      newModelName,
      restrictedClassifierNames,
      modelIsValid,
      activeLabeledItems,
      classifierStatus,
      modelIsTrained,
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
    if (!precheck.channelsValid) {
      newErrors.push({
        reason: ErrorReason.ChannelMismatch,
        message: `The model requires ${modelConfig?.preprocessingSettings?.inputShape.channels}-channel images, but the project images have ${projectChannels}`,
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
  }, [precheck, modelConfig, projectChannels, modelTarget, newModelName]);

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
      handleSetModelParams,
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
      handleSetModelParams,
      userDefinedSeed,
      setUserDefinedSeed,
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
