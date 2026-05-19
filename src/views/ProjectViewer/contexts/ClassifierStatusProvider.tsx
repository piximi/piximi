import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useImmer } from "use-immer";

import { useClassificationModel } from "hooks";

import {
  selectAllCreatedModelNames,
  selectModelInfo,
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
import type { Shape } from "store/dataV2/types";
import { classifierSlice } from "store/classifier";

import { Partition } from "utils/dl/enums";
import { findReplicateName, representsUnknown } from "utils/stringUtils";
import { getDefaultModelParams } from "utils/dl/classification/utils";
import type {
  ClassifierModelParams,
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

export type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

type ClassifierStateContextProp = {
  isReady: boolean;
  trainable: boolean;
  shouldWarnClearPredictions: boolean;
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
  trainable: true,
  shouldWarnClearPredictions: false,
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

export const ClassifierStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);

  const modelConfig = useClassificationModel();
  const modelInfo = useParameterizedSelector(selectModelInfo, modelTarget);
  const inferenceItems = useParameterizedSelector(
    selectActiveItemsByPartition,
    Partition.Inference,
  );
  const activeLabeledItems = useSelector(selectActiveLabeledItems);
  const projectChannels = useSelector(selectProjectImageChannels);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );

  const [isReady, setIsReady] = useState(true);
  const [newModelName, setNewModelName] = useState("");
  const restrictedClassifierNames = useSelector(selectAllCreatedModelNames);

  const [error, setError] = useState<ErrorContext>();
  const [activeErrors, setActiveErrors] = useState<ErrorContext[]>([]);

  const hasLabeledInference = useMemo(() => {
    return inferenceItems.some((item) => !representsUnknown(item.categoryId));
  }, [inferenceItems]);

  const shouldWarnClearPredictions = useMemo(() => {
    return showClearPredictionsWarning && hasLabeledInference;
  }, [showClearPredictionsWarning, hasLabeledInference]);

  const trainable = useMemo(
    () => !modelConfig || modelConfig.trainable,
    [modelConfig],
  );
  const noLabeledThings = useMemo(
    () => activeLabeledItems.length === 0,
    [activeLabeledItems],
  );

  const [userDefinedSeed, setUserDefinedSeed] = useState<number | undefined>();

  const [newModelParams, updateNewModelParams] = useImmer(
    getDefaultModelParams(projectChannels),
  );
  const modelParams = useMemo(() => {
    if (modelInfo)
      return {
        preprocessSettings: modelInfo.preprocessSettings,
        optimizerSettings: modelInfo.optimizerSettings,
      };
    return newModelParams;
  }, [modelInfo, newModelParams]);

  const handleUpdateOptimizerSettings = (
    settings: Partial<OptimizerSettings>,
  ) => {
    if (modelInfo)
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
  };
  const handleUpdatePreprocessSettings = (
    settings: RecursivePartial<PreprocessSettings>,
  ) => {
    if (modelInfo)
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
  };
  const handleUpdateInputShape = (inputShape: Partial<Shape>) => {
    if (modelInfo)
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
  };
  const handleSetModelParams = (params: ClassifierModelParams) => {
    updateNewModelParams(() => params);
  };

  useEffect(() => {
    const newErrors: ErrorContext[] = [];
    let newIsReady = true;

    if (!trainable) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.NotTrainable,
        message: "Selected model is not trainable.",
        severity: 1,
      });
    }
    if (noLabeledThings) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.NoLabeledImages,
        message: "Please label images to train a model.",
        severity: 3,
      });
    }
    if (
      modelConfig?.preprocessingSettings &&
      projectChannels &&
      projectChannels !== modelConfig.preprocessingSettings.inputShape.channels
    ) {
      newIsReady = false;

      newErrors.push({
        reason: ErrorReason.ChannelMismatch,
        message: `The model requires ${modelConfig?.preprocessingSettings.inputShape.channels}-channel images, but the project images have ${projectChannels}`,
        severity: 2,
      });
    }
    if (findReplicateName(newModelName, restrictedClassifierNames)) {
      newIsReady = false;
      newErrors.push({
        reason: ErrorReason.DuplicateModelName,
        message: `A model with the name ${newModelName} already exists`,
        severity: 1,
      });
    }

    if (modelInfo && !modelInfo.valid) {
      newIsReady = false;
      newErrors.push({
        reason: ErrorReason.Invalid,
        message: `Categories have changed since last training run`,
        severity: 3,
      });
    }

    const mostSevere: undefined | ErrorContext =
      newErrors.length === 0
        ? undefined
        : newErrors.reduce((prev, curr) =>
            curr.severity < prev.severity ? curr : prev,
          );
    setIsReady(newIsReady);
    setError(mostSevere);
    setActiveErrors(newErrors);
  }, [
    modelConfig,
    trainable,
    noLabeledThings,
    projectChannels,
    modelTarget,
    newModelName,
    restrictedClassifierNames,
  ]);

  useEffect(() => {
    if (modelInfo) {
      handleSetModelParams({
        preprocessSettings: modelInfo.preprocessSettings,
        optimizerSettings: modelInfo.optimizerSettings,
      });
      return;
    }
    handleSetModelParams(getDefaultModelParams(projectChannels));
  }, [modelInfo]);

  return (
    <ClassifierStatusContext.Provider
      value={{
        isReady,
        trainable,
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
      }}
    >
      {children}
    </ClassifierStatusContext.Provider>
  );
};

export const useClassifierStatus = () => {
  return useContext(ClassifierStatusContext);
};
