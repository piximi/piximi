//@ts-nocheck Errors will be adressed during with refactor
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { useSelector } from "react-redux";

import type { ModelLifecycleStatus } from "store/classifier/types";
import { selectAllImages } from "store/data/selectors";
import { selectSegmenterModel } from "store/segmenter/selectors";

export enum ErrorReason {
  NotConfigured,
  NoInferenceImages,
  ExistingKind,
}

export type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

const SegmenterStatusContext = createContext<{
  isReady: boolean;
  modelStatus: ModelLifecycleStatus;
  setModelStatus: React.Dispatch<React.SetStateAction<ModelLifecycleStatus>>;
  error?: ErrorContext;
}>({
  isReady: true,
  modelStatus: "idle",
  setModelStatus: (_value: React.SetStateAction<ModelLifecycleStatus>) => {},
});

export const SegmenterStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const selectedModel = useSelector(selectSegmenterModel);
  const projectImages = useSelector(selectAllImages);

  const [isReady, setIsReady] = useState(true);
  const [error, setError] = useState<ErrorContext>();

  const [modelStatus, setModelStatus] = useState<ModelLifecycleStatus>("idle");

  useEffect(() => {
    let newError: ErrorContext | undefined;
    let newIsReady = true;
    if (!selectedModel?.pretrained) {
      newError = {
        reason: ErrorReason.NotConfigured,
        message: "Model is not configured for inference",
        severity: 1,
      };
      newIsReady = false;
    }
    if (projectImages.length === 0) {
      newIsReady = false;
      if (!error || error.severity > 1) {
        newError = {
          reason: ErrorReason.NoInferenceImages,
          message: "No images available for inference",
          severity: 2,
        };
      }
    }
    setIsReady(newIsReady);
    setError(newError);
  }, [selectedModel, projectImages]);

  return (
    <SegmenterStatusContext.Provider
      value={{
        isReady,
        modelStatus,
        setModelStatus,
        error,
      }}
    >
      {children}
    </SegmenterStatusContext.Provider>
  );
};

export const useSegmenterStatus = () => {
  return useContext(SegmenterStatusContext);
};
