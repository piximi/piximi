import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import {
  selectChannelMetaEntities,
  selectExtendedImages,
} from "store/data/selectors";

import { arrayRange } from "utils/arrayUtils";

import type React from "react";

import type { ChannelMetaEntities } from "core/entities";
import type {
  SegmentaionModelDetails,
  SegmentationState,
} from "core/dl/segmentation/types";

enum ErrorReason {
  NotConfigured,
  NoInferenceImages,
  ExistingKind,
  ChannelMismatch,
}

type ErrorContext = {
  reason: ErrorReason;
  message: string;
  severity: number;
};
type Precheck = {
  images: boolean; // success -> true
  channels: boolean; // success -> true
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

  const [modelStatus, setModelStatus] = useState<SegmentationState>("idle");
  const channelMetas = useSelector(selectChannelMetaEntities);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const precheck: Precheck = useMemo(
    () => ({
      images: projectImages.length > 0,
      channels:
        selectedChannels.length > 0 ||
        selectedChannels.every((id) => id !== ""),
    }),
    [projectImages, selectedChannels],
  );

  const isReady = useMemo(
    () => Object.values(precheck).every((b) => b),
    [precheck],
  );
  const activeErrors = useMemo(() => {
    const newErrors: ErrorContext[] = [];
    if (!precheck.images) {
      newErrors.push({
        reason: ErrorReason.NoInferenceImages,
        message: "No images available for inference",
        severity: 1,
      });
    }
    if (!precheck.channels) {
      newErrors.push({
        reason: ErrorReason.ChannelMismatch,
        message: "Select channels for segmentation",
        severity: 2,
      });
    }
    return newErrors;
  }, [precheck]);

  const error = useMemo(
    () =>
      activeErrors.length === 0
        ? undefined
        : activeErrors.reduce((prev, curr) =>
            curr.severity < prev.severity ? curr : prev,
          ),
    [activeErrors],
  );
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
