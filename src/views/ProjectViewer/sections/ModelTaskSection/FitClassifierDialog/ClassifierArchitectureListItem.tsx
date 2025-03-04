import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { ArchitectureSettings } from "../training-settings";

import { classifierSlice } from "store/classifier";
import {
  selectActiveClassifierInputShape,
  selectActiveClassifierModelWithIdx,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { kindClassifierModelDict } from "utils/models/availableClassificationModels";

export const ClassifierArchitectureListItem = () => {
  const dispatch = useDispatch();

  const inputShape = useSelector(selectActiveClassifierInputShape);
  const selectedModel = useSelector(selectActiveClassifierModelWithIdx);
  const activeKindId = useSelector(selectActiveKindId);

  const modelOptions = useMemo(
    () =>
      kindClassifierModelDict[activeKindId]
        .map((m, i) => ({
          name: m.name,
          trainable: m.trainable,
          loaded: m.modelLoaded,
          idx: i,
        }))
        .filter((m) => m.trainable || m.loaded),
    [activeKindId],
  );

  const dispatchModel = (disposePrevious: boolean, modelIdx: number) => {
    dispatch(
      classifierSlice.actions.updateSelectedModelIdx({
        modelIdx: modelIdx,
        kindId: activeKindId,
        disposePrevious,
      }),
    );

    // if the selected model requires a specific number of input channels,
    // dispatch that number to the store
    if (selectedModel.model.requiredChannels) {
      dispatch(
        classifierSlice.actions.updateInputShape({
          inputShape: {
            ...inputShape,
            channels: selectedModel.model.requiredChannels,
          },
          kindId: activeKindId,
        }),
      );
    }
  };

  const dispatchShape = (value: number, inputID: string) => {
    switch (inputID) {
      case "shape-rows":
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, height: value },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-cols":
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, width: value },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-channels":
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, channels: value },
            kindId: activeKindId,
          }),
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
