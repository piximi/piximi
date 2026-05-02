import React from "react";

import { Divider, Stack } from "@mui/material";

import { CategoryFilterList } from "./CategoryFilterList";
import { PartitionFilterList } from "./PartitionFilterList";
import { SortSelect } from "./SortSelect";

export const ItemFilters = () => {
  return (
    <Stack maxWidth="100%">
      <SortSelect />
      <Divider />
      <CategoryFilterList />
      <PartitionFilterList />
    </Stack>
  );
};
