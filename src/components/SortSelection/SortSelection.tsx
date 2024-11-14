import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { MenuItem, Select, SelectChangeEvent } from "@mui/material";

import { projectSlice } from "store/project";

import { selectSortType } from "store/project/selectors";
import { ThingSortKey } from "utils/common/enums";

export const SortSelection = () => {
  const dispatch = useDispatch();

  const selectedSortKey = useSelector(selectSortType);
  const [selectedKey, setSelectedKey] = useState<ThingSortKey>(selectedSortKey);

  const onSortKeyChange = (event: SelectChangeEvent<unknown>) => {
    setSelectedKey(event.target.value as ThingSortKey);
    dispatch(
      projectSlice.actions.setSortType_new({
        sortType: event.target.value as ThingSortKey,
      })
    );
  };

  return (
    <>
      <Select //TODO: This should be a styled component. Styling keeps label in border
        size="small"
        sx={{
          width: 120,
          "& legend": {
            visibility: "visible",
            maxWidth: "100%",
            width: "60px",
            "& span": {
              opacity: 1,
            },
          },
          "& span": {
            opacity: "inherit",
            maxWidth: "100%",
            lineHeight: 0.7,
            position: "absolute ",
          },
        }}
        labelId="sort-select-label"
        value={selectedKey}
        label="Order by:"
        onChange={onSortKeyChange}
      >
        {Object.values(ThingSortKey).map((sortType) => (
          <MenuItem
            key={sortType}
            value={sortType}
            dense
            sx={{ width: "120px" }}
          >
            {sortType}
          </MenuItem>
        ))}
      </Select>
    </>
  );
};
