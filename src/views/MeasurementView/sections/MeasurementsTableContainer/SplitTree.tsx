import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Divider, Typography } from "@mui/material";
import { TreeViewBaseItem } from "@mui/x-tree-view";

import { StyledRichTreeView } from "views/MeasurementView/components/StyledRichTreeView";
import { measurementsSlice } from "../../state/redux/measurementsSlice";
import { GroupedMeasurementDisplayTable } from "../../types";

import { selectTableSplitOptions } from "views/MeasurementView/state/redux/reselectors";

/**
 * Utility function to build a map of itemId to its parent's itemId.
 * This is crucial for looking up the parent of any selected node without re-traversing the tree.
 */
export const getParentMap = (
  items: TreeViewBaseItem[],
  parentId: string | null = null,
  map: Record<string, string | null> = {},
): Record<string, string | null> => {
  items.forEach((item) => {
    map[item.id] = parentId;
    if (item.children) {
      getParentMap(item.children, item.id, map);
    }
  });
  return map;
};

export const SplitTree = ({
  table,
}: {
  table: GroupedMeasurementDisplayTable;
}) => {
  const dispatch = useDispatch();

  const splitOptions = useSelector(selectTableSplitOptions);
  const [selectedCategorySplits, setSelectedCategorySplits] = useState<
    string[]
  >([]);
  const [selectedPartitionSplits, setSelectedPartitionSplits] = useState<
    string[]
  >([]);
  const [selectedImageIdSplits, setSelectedImageIdSplits] = useState<string[]>(
    [],
  );
  const [selectedTimepointSplits, setSelectedTimepointSplits] = useState<
    string[]
  >([]);
  const [selectedTrackletSplits, setSelectedTrackletSplits] = useState<
    string[]
  >([]);

  const parentMap = React.useMemo(() => getParentMap(splitOptions), []);

  const handleItemSelectionToggle = (
    event: React.SyntheticEvent | null,
    itemId: string,
    isSelected: boolean,
  ) => {
    if (
      ["category", "partition", "imageId", "timepoint", "tracklet"].includes(
        itemId,
      )
    )
      return;
    switch (parentMap[itemId]) {
      case "category":
        setSelectedCategorySplits((selected) => {
          if (isSelected) {
            return [...selected, itemId];
          } else return selected.filter((item) => item !== itemId);
        });
        break;
      case "partition":
        setSelectedPartitionSplits((selected) => {
          if (isSelected) {
            return [...selected, itemId];
          } else return selected.filter((item) => item !== itemId);
        });
        break;
      case "imageId":
        setSelectedImageIdSplits((selected) => {
          if (isSelected) {
            return [...selected, itemId];
          } else return selected.filter((item) => item !== itemId);
        });
        break;
      case "timepoint":
        setSelectedTimepointSplits((selected) => {
          if (isSelected) {
            return [...selected, itemId];
          } else return selected.filter((item) => item !== itemId);
        });
        break;
      case "tracklet":
        setSelectedTrackletSplits((selected) => {
          if (isSelected) {
            return [...selected, itemId];
          } else return selected.filter((item) => item !== itemId);
        });
        break;
    }
    // onSelect((selected) => {
    //   if (isSelected) {
    //     return [...selected, itemId];
    //   } else return selected.filter((item) => item !== itemId);
    // });
  };

  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateSplits({
        groupId: table.id,
        category: selectedCategorySplits,
      }),
    );
  }, [selectedCategorySplits, table.id]);

  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateSplits({
        groupId: table.id,
        partition: selectedPartitionSplits,
      }),
    );
  }, [selectedPartitionSplits, table.id]);
  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateSplits({
        groupId: table.id,
        imageId: selectedImageIdSplits,
      }),
    );
  }, [selectedImageIdSplits, table.id]);

  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateSplits({
        groupId: table.id,
        timepoint: selectedTimepointSplits,
      }),
    );
  }, [selectedTimepointSplits, table.id]);
  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateSplits({
        groupId: table.id,
        tracklet: selectedTrackletSplits,
      }),
    );
  }, [selectedTrackletSplits, table.id]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        border: `1px solid rgba(23, 23, 23, 1)`,
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Box sx={{ height: "38px" }}>
        <Typography variant="h6" sx={{ px: 1, py: 0.5, fontSize: "1rem" }}>
          Split Options
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(23, 23, 23, 1)" }} />
      <Box
        sx={(theme) => ({
          width: "100%",
          height: "100%",
          overflow: "scroll",
          bgcolor: theme.palette.background.paper.slice(0, -1) + ",0.7)",
        })}
      >
        <StyledRichTreeView
          items={splitOptions}
          multiSelect
          checkboxSelection
          onItemSelectionToggle={handleItemSelectionToggle}
          selectionPropagation={{ parents: true, descendants: true }}
        />
      </Box>
    </Box>
  );
};
