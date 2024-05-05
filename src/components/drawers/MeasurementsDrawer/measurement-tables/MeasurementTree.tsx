import React from "react";
import { selectSelectedTableMeasurements } from "store/measurements/selectors";
import { useDispatch, useSelector } from "react-redux";
import { SelectionTreeItems, MeasurementTable } from "store/measurements/types";
import { RecursivePartial } from "utils/common/types";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { SelectionTree } from "components/styled-components";
import { selectTreeItemChildren } from "utils/common/helpers";

export const TableMeasurementTree = ({
  table,
}: {
  table: MeasurementTable;
}) => {
  const dispatch = useDispatch();
  const selectedMeasurements = useSelector(selectSelectedTableMeasurements)(
    table.id
  );

  const handleSelect = (event: React.SyntheticEvent, itemIds: string[]) => {
    const itemId = itemIds[0];
    const updates: RecursivePartial<SelectionTreeItems> = {};
    const updatedSelectionStatus = selectedMeasurements.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      table.measurementsStatus,
      updatedSelectionStatus
    );

    dispatch(
      measurementsSlice.actions.updateTableMeasurementState({
        tableId: table.id,
        updates,
      })
    );
  };

  return (
    <SelectionTree
      treeItems={table.measurementsStatus}
      selectedItems={selectedMeasurements}
      handleSelect={handleSelect}
      entryPoint="intensity"
    />
  );
};
