import type React from "react";
import { useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, capitalize } from "@mui/material";

import { StyledRichTreeView } from "@MeasurementViewer/components/StyledRichTreeView";
import { measurementsSlice } from "@MeasurementViewer/state";
import { toChannelMeasurementLabel } from "@MeasurementViewer/utils";
import getCustomTreeItem from "@MeasurementViewer/components/CustomTreeItem";
import {
  CHANNEL_MEASUREMENT_KEYS,
  INTENSE_MEAS_LOOKUP,
} from "store/data/consts";
import { selectProjectChannels } from "store/project/selectors";

import { getDifferences } from "utils/arrayUtils";

import type { CustomTreeViewBaseItem } from "@MeasurementViewer/components/CustomTreeItem";
import type {
  ImageMeasurementGroup,
  ObjectMeasurementGroup,
} from "@MeasurementViewer/types";

const selectionPropagation = { parents: true, descendants: true };
export const TrackMeasurementOptions = ({
  group,
  onSelect,
}: {
  group: ObjectMeasurementGroup | ImageMeasurementGroup;
  onSelect: (itemIds: string[]) => void;
}) => {
  const dispatch = useDispatch();
  const channels = useSelector(selectProjectChannels);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const intensityMeasurementItems = useMemo(
    () =>
      [
        {
          id: "track",
          label: "Track",

          children: [
            "trajectoryX",
            "trajectoryY",
            "distanceTraveled",
            "Displacement",
            "Lifetime",
            "Linearity",
          ].map((key) => ({
            id: key,
            label: capitalize(key),
          })),
        },
      ] as CustomTreeViewBaseItem[],
    [channels],
  );
  const handleSelectedItemsChange = (
    event: React.SyntheticEvent | null,
    newSelectedItems: string[] | string | null,
  ) => {
    if (newSelectedItems === null) newSelectedItems = [];
    else if (!Array.isArray(newSelectedItems))
      newSelectedItems = [newSelectedItems];
    // Omit top level category "computed"

    setSelectedItems(newSelectedItems);
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
