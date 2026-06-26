import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { selectExtendedImages } from "store/dataV2/selectors";

import type {
  SegmentaionModelDetails,
  SegmentationState,
} from "utils/dl/segmentation/types";

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
  selectedModel: SegmentaionModelDetails | undefined;
  setSelectedModel: React.Dispatch<
    React.SetStateAction<SegmentaionModelDetails | undefined>
  >;
  modelStatus: SegmentationState;
  setModelStatus: React.Dispatch<React.SetStateAction<SegmentationState>>;
  error?: ErrorContext;
}>({
  selectedModel: undefined,
  setSelectedModel: (
    _value: React.SetStateAction<SegmentaionModelDetails | undefined>,
  ) => {},
  isReady: true,
  modelStatus: "idle",
  setModelStatus: (_value: React.SetStateAction<SegmentationState>) => {},
});

export const SegmenterStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedModel, setSelectedModel] = useState<
    SegmentaionModelDetails | undefined
  >(undefined);
  const projectImages = useSelector(selectExtendedImages);

  const [isReady, setIsReady] = useState(true);
  const [error, setError] = useState<ErrorContext>();

  const [modelStatus, setModelStatus] = useState<SegmentationState>("idle");

  useEffect(() => {
    let newError: ErrorContext | undefined;
    let newIsReady = true;

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

  const value = useMemo(
    () => ({
      selectedModel,
      setSelectedModel,
      isReady,
      modelStatus,
      setModelStatus,
      error,
    }),
    [selectedModel, isReady, modelStatus, error],
  );

  return (
    <SegmenterStatusContext.Provider value={value}>
      {children}
    </SegmenterStatusContext.Provider>
  );
};

export const useSegmenterStatus = () => {
  return useContext(SegmenterStatusContext);
};
