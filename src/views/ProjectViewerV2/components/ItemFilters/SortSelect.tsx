import { useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, MenuItem, Typography } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { projectSlice } from "@ProjectViewer/state";
import { selectActiveViewState } from "@ProjectViewer/state/selectors";
import { AnnotationSortType, ImageSortType } from "@ProjectViewer/state/types";

export const SortSelect = () => {
  const dispatch = useDispatch();
  const activeViewState = useSelector(selectActiveViewState);

  const onSortKeyChange = (event: SelectChangeEvent<unknown>) => {
    if (activeViewState.view === "images")
      dispatch(
        projectSlice.actions.setImageSortType(
          event.target.value as ImageSortType,
        ),
      );
    else
      dispatch(
        projectSlice.actions.setAnnotationSortType({
          kindId: activeViewState.id,
          sortType: event.target.value as AnnotationSortType,
        }),
      );
  };
  const sortTypes =
    activeViewState.view === "images" ? ImageSortType : AnnotationSortType;
  return (
    <Box
      sx={(theme) => ({
        p: theme.spacing(1),
        display: "flex",
        alignItems: "center",
        width: "100%",
        justifyContent: "space-between",
      })}
    >
      <Typography variant="body2">Sort Type </Typography>
      <StyledSelect
        value={activeViewState.sortType}
        onChange={onSortKeyChange}
        variant="standard"
      >
        {Object.values(sortTypes).map((sortType) => (
          <MenuItem
            key={sortType}
            value={sortType}
            dense
            sx={{
              borderRadius: 0,
              minHeight: "1rem",
            }}
          >
            {sortType}
          </MenuItem>
        ))}
      </StyledSelect>
    </Box>
  );
};
