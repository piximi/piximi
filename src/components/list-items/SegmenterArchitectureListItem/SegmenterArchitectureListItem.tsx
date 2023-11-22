import { useDispatch, useSelector } from "react-redux";
import { ArchitectureSettings } from "components/forms";
import { CollapsibleListItem } from "../CollapsibleListItem";
import {
  segmenterSlice,
  selectSegmenterInputShape,
  selectSegmenterModelIdx,
} from "store/slices/segmenter";
import { availableSegmenterModels } from "types/ModelType";

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
