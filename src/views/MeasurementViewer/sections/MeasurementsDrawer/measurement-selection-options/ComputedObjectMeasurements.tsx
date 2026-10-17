import { useMemo } from "react";

import { useDispatch } from "react-redux";

import { Box } from "@mui/material";

import { OBJECT_FEATURES } from "core/entities";

import { HelpItem } from "help/HelpContent";

import { getDifferences } from "utils/arrayUtils";

import { measurementsSlice } from "@MeasurementViewer/state";
import { StyledRichTreeView } from "@MeasurementViewer/components/StyledRichTreeView";
import { getCustomTreeItem } from "@MeasurementViewer/components/CustomTreeItem";
import { OBJ_MEAS_LABELS, OBJ_MEAS_LOOKUP } from "@MeasurementViewer/utils";

import type React from "react";

import type { ObjectFeature } from "core/entities";

import type { CustomTreeViewBaseItem } from "@MeasurementViewer/components/CustomTreeItem";
import type { ObjectMeasurementGroup } from "@MeasurementViewer/types";

const shapeMeasurementItems: CustomTreeViewBaseItem[] = [
  {
    id: "shape",
    label: "Shape",

    children: OBJECT_FEATURES.map((key) => ({
      id: key,
      label: OBJ_MEAS_LABELS[key],
    })),
  },
];

const selectionPropagation = { parents: true, descendants: true };

export const ComputedObjectMeasurementOptions = ({
  group,
}: {
  group: ObjectMeasurementGroup;
}) => {
  const dispatch = useDispatch();

  const selectedItems = useMemo(() => group.featureMeasurements, [group]);

  const handleSelectedItemsChange = (
    event: React.SyntheticEvent | null,
    newSelectedItems: string[] | string | null,
  ) => {
    if (newSelectedItems === null) newSelectedItems = [];
    else if (!Array.isArray(newSelectedItems))
      newSelectedItems = [newSelectedItems];
    // Omit top level category "shape"
    const onlyMeasurements = newSelectedItems.filter((id) => id !== "shape");
    // Process newSelectedItems array to determine newly added and removed
    const changes = getDifferences(selectedItems, onlyMeasurements);

    if (changes.added.length > 0) {
      dispatch(
        measurementsSlice.actions.addObjectComputedMeasurements({
          groupId: group.id,
          measurements: changes.added as ObjectFeature[],
        }),
      );
    }
    // Immediately remove deselected measurements
    if (changes.removed.length > 0)
      dispatch(
        measurementsSlice.actions.removeObjectComputedMeasurements({
          groupId: group.id,
          measurements: changes.removed as ObjectFeature[],
        }),
      );
  };

  return (
    <Box data-help={HelpItem.ObjectMeasurements}>
      <StyledRichTreeView
        items={shapeMeasurementItems}
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
