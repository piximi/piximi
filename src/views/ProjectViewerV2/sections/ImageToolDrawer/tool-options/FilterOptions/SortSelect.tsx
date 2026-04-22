import { useDispatch, useSelector } from "react-redux";
import { Box, MenuItem, SelectChangeEvent } from "@mui/material";

import { StyledSelect, WithLabel } from "components/inputs";

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
    <Box sx={(theme) => ({ p: theme.spacing(1) })}>
      <WithLabel
        label="Sort by:"
        labelProps={{
          variant: "body2",
          sx: {
            mr: "0.5rem",
            whiteSpace: "nowrap",
          },
        }}
        fullWidth
      >
        <StyledSelect
          value={activeViewState.sortType}
          onChange={onSortKeyChange}
          fullWidth
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
      </WithLabel>
    </Box>
  );
};
