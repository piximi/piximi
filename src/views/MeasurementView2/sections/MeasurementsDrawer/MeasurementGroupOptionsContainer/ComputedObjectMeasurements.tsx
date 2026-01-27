import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { Box } from "@mui/material";

import { StyledRichTreeView } from "views/MeasurementView2/components/StyledRichTreeView";
import { measurementsSlice } from "../../../state/redux/measurementsSlice";
import getCustomTreeItem, { CustomTreeViewBaseItem } from "./CustomTreeItem";
import { ObjectMeasurementGroup } from "../../../types";

import { OBJ_MEAS_LOOKUP, OBJECT_MEASUREMENT_KEYS } from "store/data/consts";
import { ComputedObjectMeasurements } from "store/data/types";

import { getDifferences } from "utils/arrayUtils";
import { capitalize } from "utils/stringUtils";

const computedMeasurementItems: CustomTreeViewBaseItem[] = [
  {
    id: "computed",
    label: "Computed",

    children: OBJECT_MEASUREMENT_KEYS.filter((key) => key !== "channels").map(
      (key) => ({ id: key, label: capitalize(key), displayName: "abba" }),
    ),
  },
];

const selectionPropagation = { parents: true, descendants: true };

export const ComputedObjectMeasurementOptions = ({
  group,
  onSelect,
}: {
  group: ObjectMeasurementGroup;
  onSelect: (itemIds: string[]) => void;
}) => {
  const dispatch = useDispatch();

  const selectedItems = useMemo(() => group.computedMeasurements, [group]);

  const handleSelectedItemsChange = (
    event: React.SyntheticEvent | null,
    newSelectedItems: string[] | string | null,
  ) => {
    if (newSelectedItems === null) newSelectedItems = [];
    else if (!Array.isArray(newSelectedItems))
      newSelectedItems = [newSelectedItems];
    // Omit top level category "computed"
    const onlyMeasurements = newSelectedItems.filter((id) => id !== "computed");
    // Process newSelectedItems array to determine newly added and removed
    const changes = getDifferences(selectedItems, onlyMeasurements);

    // Run the newly added through the worker scheduler,
    //  they will be added to the selected list after completion
    if (changes.added.length > 0) {
      onSelect(changes.added);
    }
    // Immediately remove deselected measurements
    if (changes.removed.length > 0)
      dispatch(
        measurementsSlice.actions.removeObjectComputedMeasurements({
          groupId: group.id,
          measurements: changes.removed as (keyof ComputedObjectMeasurements)[],
        }),
      );
  };

  return (
    <Box>
      <StyledRichTreeView
        items={computedMeasurementItems}
        multiSelect
        checkboxSelection
        selectedItems={selectedItems}
        selectionPropagation={selectionPropagation}
        onSelectedItemsChange={handleSelectedItemsChange}
        slots={{
          item: getCustomTreeItem(OBJ_MEAS_LOOKUP),
        }}
      />
    </Box>
  );
};
