import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { selectChannelMetaEntities } from "store/data/selectors";
import {
  selectLoadedSegmenter,
  selectSegmenterChannels,
  selectSegmenterKindName,
  selectSegmenterOptions,
  selectSegmenterStatus,
  selectSegmentorError,
} from "store/segmenter/selectors";
import { segmenterSlice } from "store/segmenter/segmenterSlice";

import type React from "react";

import type {
  SegmentationModelDetails,
  SegmentationState,
  SegmenterOptionSchema,
  SegmenterOptionValues,
} from "core/dl/segmentation/types";
import type { ChannelMetaEntities } from "core/entities";

import type { ErrorContext } from "../../../store/segmenter/segmenterReadiness";

type SegmenterControls = {
  loadedModel: SegmentationModelDetails | undefined;
  schema: SegmenterOptionSchema | undefined;
  modelStatus: SegmentationState;
  channelMetas: ChannelMetaEntities;
  channelSelection: Array<string>;
  optionValues: SegmenterOptionValues;
  error?: ErrorContext;
  kindName?: string;
  setLoadedModel: (model: SegmentationModelDetails) => void;
  setChannelSelection: (index: number, id: string) => void;
  removeChannelSelection: (index: number) => void;
  addChannelSelection: () => void;
  setOptionValue: (
    key: string,
    value: number | boolean | string | undefined,
  ) => void;
  setModelStatus: (status: SegmentationState) => void;
  resetOptions: () => void;
};

export const useSegmenter = (): SegmenterControls => {
  const dispatch = useDispatch();
  const loadedModel = useSelector(selectLoadedSegmenter);
  const modelStatus = useSelector(selectSegmenterStatus);
  const channelMetas = useSelector(selectChannelMetaEntities);
  const channelSelection = useSelector(selectSegmenterChannels);
  const optionValues = useSelector(selectSegmenterOptions);
  const kindName = useSelector(selectSegmenterKindName);
  const error = useSelector(selectSegmentorError);

  const availableChannelIds = useMemo(
    () => Object.values(channelMetas).map((ch) => ch.id),
    [channelMetas],
  );

  const schema = useMemo(() => loadedModel?.optionSchema, [loadedModel]);

  const setLoadedModel = (model: SegmentationModelDetails) =>
    dispatch(
      segmenterSlice.actions.modelLoaded({ model, availableChannelIds }),
    );

  const setModelStatus = useCallback(
    (status: SegmentationState) =>
      dispatch(segmenterSlice.actions.modelStatusSet(status)),
    [dispatch],
  );

  const setChannelSelection = useCallback(
    (index: number, id: string) =>
      dispatch(segmenterSlice.actions.channelSlotSet({ index, id })),
    [dispatch],
  );
  const removeChannelSelection = useCallback(
    (index: number) =>
      dispatch(segmenterSlice.actions.channelSlotRemoved(index)),
    [dispatch],
  );
  const addChannelSelection = useCallback(
    () => dispatch(segmenterSlice.actions.channelSlotAdded()),
    [dispatch],
  );
  const setOptionValue = useCallback(
    (key: string, value: number | boolean | string | undefined) => {
      dispatch(segmenterSlice.actions.optionValueSet({ key, value }));
    },
    [],
  );

  const resetOptions = useCallback(() => {
    dispatch(
      segmenterSlice.actions.configReset({
        availableChannelIds: loadedModel ? availableChannelIds : [],
      }),
    );
  }, [loadedModel, channelMetas, dispatch]);

  return {
    loadedModel,
    setLoadedModel,
    channelMetas,
    channelSelection,
    setChannelSelection,
    removeChannelSelection,
    addChannelSelection,
    optionValues,
    setOptionValue,
    resetOptions,
    modelStatus,
    setModelStatus,
    error,
    schema,
    kindName,
  };
};
