import type React from "react";
import { useMemo } from "react";

import { useDispatch } from "react-redux";

import { Box } from "@mui/material";

import { measurementsSlice } from "@MeasurementViewer/state";
import { StyledRichTreeView } from "@MeasurementViewer/components/StyledRichTreeView";
import getCustomTreeItem from "@MeasurementViewer/components/CustomTreeItem";
import {
  OBJ_MEAS_LOOKUP,
  COMPUTED_OBJECT_MEASUREMENT_KEYS,
} from "store/data/consts";
import type { ComputedObjectMeasurements } from "store/data/types";

import { getDifferences } from "utils/arrayUtils";
import { formatString } from "utils/stringUtils";

import type { CustomTreeViewBaseItem } from "@MeasurementViewer/components/CustomTreeItem";
import type { ObjectMeasurementGroup } from "@MeasurementViewer/types";

const computedMeasurementItems: CustomTreeViewBaseItem[] = [
  {
    id: "computed",
    label: "Computed",

    children: COMPUTED_OBJECT_MEASUREMENT_KEYS.map((key) => ({
      id: key,
      label: formatString(key, undefined, "every-word"),
      displayName: "abba",
    })),
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
