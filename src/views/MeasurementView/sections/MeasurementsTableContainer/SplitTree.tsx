import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { capitalize } from "lodash";
import { Box, Divider, Typography } from "@mui/material";
import { TreeViewBaseItem } from "@mui/x-tree-view";

import { StyledRichTreeView } from "views/MeasurementView/components/StyledRichTreeView";
import { measurementsSlice } from "../../state/redux/measurementsSlice";
import { GroupedMeasurementDisplayTable } from "../../types";

import { selectKindToCategoryEntities } from "store/data/selectors";
import { Category } from "store/data/types";

import { Partition } from "utils/models/enums";
import { enumKeys } from "utils/objectUtils";

const generateTree = (categories: Category[]) => {
  return [
    {
      id: "category",
      label: "Category",

      children: categories.map((category) => ({
        id: category.id,
        label: capitalize(category.name),
        displayName: category.name,
      })),
    },
    {
      id: "partition",
      label: "Partition",
      children: enumKeys(Partition).map((ptn) => ({
        id: ptn,
        label: capitalize(ptn),
        displayName: capitalize(ptn),
      })),
    },
  ];
};
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
  kind,
}: {
  table: GroupedMeasurementDisplayTable;
  kind: string;
}) => {
  const dispatch = useDispatch();
  const categoriesByKind = useSelector(selectKindToCategoryEntities);
  const [selectedCategorySplits, setSelectedCategorySplits] = useState<
    string[]
  >([]);
  const [selectedPartitionSplits, setSelectedPartitionSplits] = useState<
    string[]
  >([]);
  const splitTree = useMemo(() => {
    return generateTree(categoriesByKind[kind]);
  }, [categoriesByKind, kind]);
  const parentMap = React.useMemo(() => getParentMap(splitTree), []);

  const handleItemSelectionToggle = (
    event: React.SyntheticEvent | null,
    itemId: string,
    isSelected: boolean,
  ) => {
    if (itemId === "category" || itemId === "partition") return;
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
        categories: selectedCategorySplits,
      }),
    );
  }, [selectedCategorySplits, table.id]);

  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateSplits({
        groupId: table.id,
        partitions: selectedPartitionSplits,
      }),
    );
  }, [selectedPartitionSplits, table.id]);

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
          items={splitTree}
          multiSelect
          checkboxSelection
          onItemSelectionToggle={handleItemSelectionToggle}
          selectionPropagation={{ parents: true, descendants: true }}
        />
      </Box>
    </Box>
  );
};
