import { useSelector } from "react-redux";

import { Stack } from "@mui/material";

import {
  selectActiveKindId,
  selectActiveView,
} from "@ProjectViewer/state/selectors";

import { AnnotationStatusFilter } from "./AnnotationStatusFilter";
import { CategoryFilterList } from "./CategoryFilterList";
import { ConfidenceFilter } from "./ConfidenceFilter";
import { PartitionFilterList } from "./PartitionFilterList";
import { SelectedImagesFilter } from "./SelectedImagesFilter";
import { SortSelect } from "./SortSelect";

export const ItemFilters = () => {
  const activeView = useSelector(selectActiveView);
  const activeKindId = useSelector(selectActiveKindId);

  return (
    <Stack
      sx={{
        maxWidth: "100%",
      }}
    >
      <SortSelect />
      <CategoryFilterList />
      <PartitionFilterList />
      <ConfidenceFilter
        key={activeView === "images" ? "images" : activeKindId}
      />
      {activeView === "images" ? (
        <AnnotationStatusFilter />
      ) : (
        <SelectedImagesFilter />
      )}
    </Stack>
  );
};
