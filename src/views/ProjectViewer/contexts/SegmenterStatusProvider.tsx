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

import { getDefaultChannelIds } from "../utils/channelUtils";
import { segmenterError } from "../utils/segmenterReadiness";

import type React from "react";

import type {
  SegmentationModelDetails,
  SegmentationState,
  SegmenterOptionSchema,
  SegmenterOptionValues,
} from "core/dl/segmentation/types";
import type { ChannelMetaEntities } from "core/entities";

import type { ErrorContext } from "../utils/segmenterReadiness";

const SegmenterStatusContext = createContext<{
  loadedModel: SegmentationModelDetails | undefined;

  setLoadedModel: React.Dispatch<
    React.SetStateAction<SegmentationModelDetails | undefined>
  >;
  channelMetas: ChannelMetaEntities;
  channelSelection: Array<string>;
  setChannelSelection: React.Dispatch<React.SetStateAction<Array<string>>>;
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
    _value: React.SetStateAction<SegmentationModelDetails | undefined>,
  ) => {},
  channelMetas: {},
  channelSelection: [],
  setChannelSelection: (_value: React.SetStateAction<Array<string>>) => {},
  optionValues: {},
  setOptionValue: (
    _key: string,
    _value: number | boolean | string | undefined,
  ) => {},
  resetOptions: () => {},
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
    SegmentationModelDetails | undefined
  >(undefined);
  const projectImages = useSelector(selectExtendedImages);

  const [modelStatus, setModelStatus] = useState<SegmentationState>("idle");
  const channelMetas = useSelector(selectChannelMetaEntities);
  const [channelSelection, setChannelSelection] = useState<Array<string>>([]);
  const [optionValues, setOptionValues] = useState<SegmenterOptionValues>({});

  const error = useMemo(
    () =>
      segmenterError({
        policy: loadedModel?.channelPolicy,
        channelIds: channelSelection,
        imageCount: projectImages.length,
      }),
    [loadedModel, channelSelection, projectImages],
  );

  const setDefaultChannelSelection = useCallback(() => {
    if (!loadedModel) {
      setChannelSelection([]);
      return;
    }
    const availableChannels = Object.values(channelMetas);
    const policy = loadedModel.channelPolicy;
    setChannelSelection(
      getDefaultChannelIds(
        policy,
        availableChannels.map((ch) => ch.id),
      ),
    );
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
      modelStatus,
      setModelStatus,
      error,
      schema,
    }),
    [
      loadedModel,
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
