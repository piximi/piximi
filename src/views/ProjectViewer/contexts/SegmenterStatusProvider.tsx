import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSelector } from "react-redux";

import { defaultOptionValues } from "core/dl/segmentation/optionUtils";

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
  SegmenterOptionSchema,
  SegmenterOptionValues,
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

/*
 * How the image's channels reach the model.
 *
 *   an ordered list of channel-meta ids. For a `fixed` model there
 *   is one slot per model input ("" = unset); for a `passthrough` model it is
 *   simply the subset, in order, that the user wants sent.
 */
type ChannelSelection = { mode: "explicit"; channelIds: string[] };

const SegmenterStatusContext = createContext<{
  isReady: boolean;
  loadedModel: SegmentaionModelDetails | undefined;

  setLoadedModel: React.Dispatch<
    React.SetStateAction<SegmentaionModelDetails | undefined>
  >;
  channelMetas: ChannelMetaEntities;
  channelSelection: ChannelSelection;
  setChannelSelection: React.Dispatch<React.SetStateAction<ChannelSelection>>;
  optionValues: SegmenterOptionValues;
  setOptionValue: (
    key: string,
    value: number | boolean | string | undefined,
  ) => void;
  resetOptions: () => void;

  modelStatus: SegmentationState;
  setModelStatus: React.Dispatch<React.SetStateAction<SegmentationState>>;
  error?: ErrorContext;
  schema: SegmenterOptionSchema | undefined;
}>({
  loadedModel: undefined,
  setLoadedModel: (
    _value: React.SetStateAction<SegmentaionModelDetails | undefined>,
  ) => {},
  channelMetas: {},
  channelSelection: { mode: "explicit", channelIds: [] },
  setChannelSelection: (_value: React.SetStateAction<ChannelSelection>) => {},
  optionValues: {},
  setOptionValue: (
    _key: string,
    _value: number | boolean | string | undefined,
  ) => {},
  resetOptions: () => {},
  isReady: true,
  modelStatus: "idle",
  setModelStatus: (_value: React.SetStateAction<SegmentationState>) => {},
  schema: undefined,
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
  const [channelSelection, setChannelSelection] = useState<ChannelSelection>({
    mode: "explicit",
    channelIds: [],
  });
  const [optionValues, setOptionValues] = useState<SegmenterOptionValues>({});

  const precheck: Precheck = useMemo(
    () => ({
      images: projectImages.length > 0,
      channels:
        !loadedModel ||
        (channelSelection.channelIds.length > 0 &&
          channelSelection.channelIds.every((id) => id !== "") &&
          (loadedModel.channelPolicy.mode !== "fixed" ||
            channelSelection.channelIds.length ===
              loadedModel.channelPolicy.count)),
    }),
    [projectImages, channelSelection, loadedModel],
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

  const setDefaultChannelSelection = useCallback(() => {
    if (!loadedModel) {
      setChannelSelection({
        mode: "explicit",
        channelIds: [],
      });
      return;
    }
    const availableChannels = Object.values(channelMetas);
    const policy = loadedModel.channelPolicy;
    const slotCap =
      policy.mode === "fixed"
        ? policy.count
        : Math.min(policy.maxChannels, availableChannels.length);
    if (policy.mode === "passthrough") {
      // The model takes the image's channels as-is by default
      setChannelSelection({
        mode: "explicit",
        channelIds: availableChannels
          .slice(0, slotCap)
          .map((channel) => channel.id),
      });
    } else {
      setChannelSelection({
        mode: "explicit",
        // A fixed-input graph needs every plane filled, so repeat the last
        // available channel when the image has fewer than the model wants.
        channelIds: arrayRange(policy.count).map((_, idx) => {
          if (availableChannels.length === 0) {
            return "";
          } else if (idx >= availableChannels.length) {
            return availableChannels.at(-1)!.id;
          } else {
            return availableChannels[idx].id;
          }
        }),
      });
    }
  }, [loadedModel, channelMetas]);
  useEffect(() => {
    if (!loadedModel) return;
    setDefaultChannelSelection();

    setOptionValues(defaultOptionValues(loadedModel.optionSchema));
  }, [loadedModel, setDefaultChannelSelection]);

  const setOptionValue = useCallback(
    (key: string, value: number | boolean | string | undefined) => {
      setOptionValues((values) =>
        values[key] === value ? values : { ...values, [key]: value },
      );
    },
    [],
  );

  const resetOptions = useCallback(() => {
    setDefaultChannelSelection();
    setOptionValues(defaultOptionValues(loadedModel?.optionSchema));
  }, [loadedModel, setDefaultChannelSelection]);
  const schema = loadedModel?.optionSchema;

  const value = useMemo(
    () => ({
      loadedModel,
      setLoadedModel,
      channelMetas,
      channelSelection,
      setChannelSelection,
      optionValues,
      setOptionValue,
      resetOptions,
      isReady,
      modelStatus,
      setModelStatus,
      error,
      schema,
    }),
    [
      loadedModel,
      isReady,
      modelStatus,
      error,
      channelMetas,
      channelSelection,
      optionValues,
      setOptionValue,
      resetOptions,
      schema,
    ],
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
