import { useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, capitalize } from "@mui/material";

import { CHANNEL_MEASUREMENTS } from "core/entities";

import { selectAllChannelMetas } from "store/data/selectors";

import { getDifferences } from "utils/arrayUtils";

import { StyledRichTreeView } from "@MeasurementViewer/components/StyledRichTreeView";
import { measurementsSlice } from "@MeasurementViewer/state";
import {
  INTENSE_MEAS_LOOKUP,
  toChannelMeasurementLabel,
} from "@MeasurementViewer/utils";
import { getCustomTreeItem } from "@MeasurementViewer/components/CustomTreeItem";

import type React from "react";

import type { CustomTreeViewBaseItem } from "@MeasurementViewer/components/CustomTreeItem";
import type {
  ImageMeasurementGroup,
  ObjectMeasurementGroup,
} from "@MeasurementViewer/types";

const selectionPropagation = { parents: true, descendants: true };
export const IntensityMeasurementOptions = ({
  group,
}: {
  group: ObjectMeasurementGroup | ImageMeasurementGroup;
}) => {
  const dispatch = useDispatch();
  const channelMetas = useSelector(selectAllChannelMetas);
  const selectedItems = useMemo(() => group.intensityMeasurements, [group]);

  const intensityMeasurementItems = useMemo(
    () =>
      [
        {
          id: "intensity",
          label: "Intensity",

          children: CHANNEL_MEASUREMENTS.map((key) => ({
            id: key,
            label: capitalize(key),
            children: channelMetas.map((cm) => ({
              id: toChannelMeasurementLabel(cm.name, key),
              label: capitalize(cm.name),
            })),
          })),
        },
      ] as CustomTreeViewBaseItem[],
    [channelMetas],
  );
  const handleSelectedItemsChange = (
    event: React.SyntheticEvent | null,
    newSelectedItems: string[] | string | null,
  ) => {
    if (newSelectedItems === null) newSelectedItems = [];
    else if (!Array.isArray(newSelectedItems))
      newSelectedItems = [newSelectedItems];
    // Omit top level category "computed"
    const onlyMeasurements = newSelectedItems.filter(
      (id) => id !== "intensity",
    );
    // Process newSelectedItems array to determine newly added and removed
    const changes = getDifferences(selectedItems, onlyMeasurements);

    if (changes.added.length > 0) {
      dispatch(
        measurementsSlice.actions.addIntensityMeasurements({
          groupId: group.id,
          measurements: changes.added,
        }),
      );
    }
    // Immediately remove deselected measurements
    if (changes.removed.length > 0) {
      dispatch(
        measurementsSlice.actions.removeIntensityMeasurements({
          groupId: group.id,
          measurements: changes.removed,
        }),
      );
    }
  };

  return (
    <Box>
      <StyledRichTreeView
        items={intensityMeasurementItems}
        multiSelect
        checkboxSelection
        selectedItems={selectedItems}
        selectionPropagation={selectionPropagation}
        onSelectedItemsChange={handleSelectedItemsChange}
        slots={{
          item: getCustomTreeItem(INTENSE_MEAS_LOOKUP),
        }}
      />
    </Box>
  );
};
