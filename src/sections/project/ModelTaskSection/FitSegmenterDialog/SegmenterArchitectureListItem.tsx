import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/UI_/CollapsibleListItem";
import { ArchitectureSettings } from "../training-settings";

import { segmenterSlice } from "store/segmenter";
import {
  selectSegmenterInputShape,
  selectSegmenterModelIdx,
} from "store/segmenter/selectors";

import { availableSegmenterModels } from "utils/models/availableSegmentationModels";

const modelOptions = availableSegmenterModels
  .map((m, i) => ({
    name: m.name,
    trainable: m.trainable,
    loaded: m.modelLoaded,
    idx: i,
  }))
  .filter((m) => m.trainable || m.loaded);

export const SegmenterArchitectureListItem = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectSegmenterModelIdx);
  const inputShape = useSelector(selectSegmenterInputShape);

  const dispatchModel = (disposePrevious: boolean, _nextModelIdx: number) => {
    dispatch(
      segmenterSlice.actions.updateSelectedModelIdx({
        modelIdx: _nextModelIdx,
        disposePrevious,
      })
    );

    const nextModel = availableSegmenterModels[_nextModelIdx];

    // if the selected model requires a specific number of input channels,
    // dispatch that number to the store
    if (nextModel.requiredChannels) {
      dispatch(
        segmenterSlice.actions.updateSegmentationInputShape({
          inputShape: {
            ...inputShape,
            channels: nextModel.requiredChannels,
          },
        })
      );
    }
  };
  const dispatchShape = (value: number, inputID: string) => {
    switch (inputID) {
      case "shape-rows":
        dispatch(
          segmenterSlice.actions.updateSegmentationInputShape({
            inputShape: { ...inputShape, height: value },
          })
        );
        return;
      case "shape-cols":
        dispatch(
          segmenterSlice.actions.updateSegmentationInputShape({
            inputShape: { ...inputShape, width: value },
          })
        );
        return;
      case "shape-channels":
        dispatch(
          segmenterSlice.actions.updateSegmentationInputShape({
            inputShape: { ...inputShape, channels: value },
          })
        );
    }
  };

  return (
    <CollapsibleListItem
      primaryText="Architecture Settings"
      carotPosition="start"
      divider={true}
    >
      <ArchitectureSettings
        modelOptions={modelOptions}
        inputShape={inputShape}
        selectedModel={selectedModel}
        dispatchModel={dispatchModel}
        dispatchShape={dispatchShape}
      />
    </CollapsibleListItem>
  );
};
