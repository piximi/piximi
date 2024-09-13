import React from "react";
import { xor } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { SelectionTree } from "components/styled-components";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { selectSelectedGroupSplits } from "store/measurements/selectors";
import { MeasurementOptions, MeasurementGroup } from "store/measurements/types";
import { RecursivePartial } from "utils/common/types";
import { selectTreeItemChildren } from "../utils";

export const SplitTree = ({
  group,
  loading,
}: {
  group: MeasurementGroup;
  loading: boolean;
}) => {
  const dispatch = useDispatch();
  const selectedSplits = useSelector(selectSelectedGroupSplits)(group.id);
  const handleSelect = (
    event: React.SyntheticEvent,
    newSelectedItems: string[],
    oldeSelectedItems: string[] = selectedSplits
  ) => {
    if (loading) return;
    const itemId = xor(newSelectedItems, oldeSelectedItems)[0];
    const updates: RecursivePartial<MeasurementOptions> = {};
    const updatedSelectionStatus = oldeSelectedItems.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      group.splitStatus,
      updatedSelectionStatus
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
      treeItems={group.splitStatus}
      selectedItems={selectedSplits}
      handleSelect={handleSelect}
      checkboxSize="small"
    />
  );
};
