import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAllImages } from "store/data/selectors";
import { selectSegmenterModel } from "store/segmenter/selectors";
import { ModelStatus } from "utils/models/enums";
import { ErrorContext, SegmenterErrorReason } from "./types";

const SegmenterStatusContext = createContext<{
  isReady: boolean;
  modelStatus: ModelStatus;
  setModelStatus: React.Dispatch<React.SetStateAction<ModelStatus>>;
  error?: ErrorContext;
}>({
  isReady: true,
  modelStatus: ModelStatus.Idle,
  setModelStatus: (_value: React.SetStateAction<ModelStatus>) => {},
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

  const [modelStatus, setModelStatus] = useState<ModelStatus>(ModelStatus.Idle);

  useEffect(() => {
    let newError: ErrorContext | undefined;
    let newIsReady = true;
    if (!selectedModel?.pretrained) {
      newError = {
        reason: SegmenterErrorReason.NotConfigured,
        message: "Model is not configured for inference",
        severity: 1,
      };
      newIsReady = false;
    }
    if (projectImages.length === 0) {
      newIsReady = false;
      if (!error || error.severity > 1) {
        newError = {
          reason: SegmenterErrorReason.NoInferenceImages,
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
