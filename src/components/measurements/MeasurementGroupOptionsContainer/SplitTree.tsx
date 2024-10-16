import React from "react";
import { xor } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { SelectionTree } from "components/styled-components";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { selectSelectedGroupSplits } from "store/measurements/selectors";
import { MeasurementOptions, MeasurementGroup } from "store/measurements/types";
import { LoadStatus, RecursivePartial } from "utils/common/types";
import { selectTreeItemChildren } from "../utils";

export const SplitTree = ({
  group,
  measurementStatus,
}: {
  group: MeasurementGroup;
  measurementStatus: LoadStatus;
}) => {
  const dispatch = useDispatch();
  const selectedSplits = useSelector(selectSelectedGroupSplits)(group.id);

  const handleSelect = (
    event: React.SyntheticEvent,
    newSelectedItems: string[],
    oldeSelectedItems: string[] = selectedSplits
  ) => {
    if (measurementStatus.loading) return;
    const itemId = xor(newSelectedItems, oldeSelectedItems)[0];
    const updates: RecursivePartial<MeasurementOptions> = {};
    const updatedSelectionState = oldeSelectedItems.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      group.splitStates,
      updatedSelectionState
    );

    dispatch(
      measurementsSlice.actions.updateGroupSplitState({
        groupId: group.id,
        updates,
      })
    );
  };

  return (
    <SelectionTree
      treeItems={group.splitStates}
      selectedItems={selectedSplits}
      handleSelect={handleSelect}
      checkboxSize="small"
    />
  );
};
