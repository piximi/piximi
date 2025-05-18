import React from "react";
import { Stack } from "@mui/material";

import { CategoryFilterList } from "./CategoryFilterList";
import { PartitionFilterList } from "./PartitionFilterList";
import { SortSelect } from "./SortSelect";

export const FilterOptions = () => {
  return (
    <Stack maxWidth="100%">
      <SortSelect />
      <CategoryFilterList />
      <PartitionFilterList />
    </Stack>
  );
};
