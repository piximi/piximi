import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, MenuItem, SelectChangeEvent } from "@mui/material";

import { StyledSelect, WithLabel } from "components/inputs";

import { projectSlice } from "store/project";
import { selectSortType } from "store/project/selectors";

import { ThingSortKey } from "utils/enums";

export const SortSelect = () => {
  const dispatch = useDispatch();

  const selectedSortKey = useSelector(selectSortType);
  const [selectedKey, setSelectedKey] = useState<ThingSortKey>(selectedSortKey);

  const onSortKeyChange = (event: SelectChangeEvent<unknown>) => {
    setSelectedKey(event.target.value as ThingSortKey);
    dispatch(
      projectSlice.actions.setSortType({
        sortType: event.target.value as ThingSortKey,
      }),
    );
  };
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
          value={selectedKey}
          onChange={onSortKeyChange}
          fullWidth
          variant="standard"
        >
          {Object.values(ThingSortKey).map((sortType) => (
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
