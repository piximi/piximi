import { SelectionTree } from "components/styled-components";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { selectSelectedTableSplits } from "store/measurements/selectors";
import { SelectionTreeItems, MeasurementTable } from "store/measurements/types";
import { selectTreeItemChildren } from "utils/common/helpers";
import { RecursivePartial } from "utils/common/types";

export const MeasurementTableSplitTree = ({
  table,
}: {
  table: MeasurementTable;
}) => {
  const dispatch = useDispatch();
  const selectedSplits = useSelector(selectSelectedTableSplits)(table.id);

  const handleSelect = (event: React.SyntheticEvent, itemIds: string[]) => {
    const itemId = itemIds[0];
    const updates: RecursivePartial<SelectionTreeItems> = {};
    const updatedSelectionStatus = selectedSplits.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      table.splitStatus,
      updatedSelectionStatus
    );

    dispatch(
      measurementsSlice.actions.updateTableSplitState({
        tableId: table.id,
        updates,
      })
    );
  };

  return (
    <SelectionTree
      treeItems={table.splitStatus}
      selectedItems={selectedSplits}
      handleSelect={handleSelect}
      entryPoint="Image"
    />
  );
};
