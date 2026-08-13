import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import {
  selectChannelMetaEntities,
  selectExtendedImages,
} from "store/data/selectors";
import type { ChannelMetaEntities } from "store/data/types";

import { arrayRange } from "utils/arrayUtils";
import type {
  SegmentaionModelDetails,
  SegmentationState,
} from "utils/dl/segmentation/types";

export enum ErrorReason {
  NotConfigured,
  NoInferenceImages,
  ExistingKind,
  ChannelMismatch,
}

export type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};

const SegmenterStatusContext = createContext<{
  isReady: boolean;
  loadedModel: SegmentaionModelDetails | undefined;

  setLoadedModel: React.Dispatch<
    React.SetStateAction<SegmentaionModelDetails | undefined>
  >;
  channelMetas: ChannelMetaEntities;
  selectedChannels: Array<string>;
  setSelectedChannels: React.Dispatch<React.SetStateAction<Array<string>>>;
  modelStatus: SegmentationState;
  setModelStatus: React.Dispatch<React.SetStateAction<SegmentationState>>;
  error?: ErrorContext;
}>({
  loadedModel: undefined,
  setLoadedModel: (
    _value: React.SetStateAction<SegmentaionModelDetails | undefined>,
  ) => {},
  channelMetas: {},
  selectedChannels: [],
  setSelectedChannels: (_value: React.SetStateAction<Array<string>>) => {},
  isReady: true,
  modelStatus: "idle",
  setModelStatus: (_value: React.SetStateAction<SegmentationState>) => {},
});

export const SegmenterStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loadedModel, setLoadedModel] = useState<
    SegmentaionModelDetails | undefined
  >(undefined);
  const projectImages = useSelector(selectExtendedImages);

  const [isReady, setIsReady] = useState(true);
  const [error, setError] = useState<ErrorContext>();

  const [modelStatus, setModelStatus] = useState<SegmentationState>("idle");
  const channelMetas = useSelector(selectChannelMetaEntities);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

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
    if (
      selectedChannels.length === 0 ||
      selectedChannels.some((id) => id === "")
    ) {
      newIsReady = false;
      if (!error || error.severity > 2) {
        newError = {
          reason: ErrorReason.ChannelMismatch,
          message: "Select channels for segmentation",
          severity: 3,
        };
      }
    }
    setIsReady(newIsReady);
    setError(newError);
  }, [loadedModel, projectImages, selectedChannels]);

  useEffect(() => {
    if (loadedModel) {
      const metas = Object.values(channelMetas);
      setSelectedChannels(
        arrayRange(loadedModel.requiredChannels).map((_, idx) => {
          if (metas.length === 0) {
            return "";
          } else if (idx >= metas.length) {
            return metas.at(-1)!.id;
          } else {
            return metas[idx].id;
          }
        }),
      );
    }
  }, [loadedModel]);

  const value = useMemo(
    () => ({
      loadedModel,
      setLoadedModel,
      channelMetas,
      selectedChannels,
      setSelectedChannels,
      isReady,
      modelStatus,
      setModelStatus,
      error,
    }),
    [loadedModel, isReady, modelStatus, error, channelMetas, selectedChannels],
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
