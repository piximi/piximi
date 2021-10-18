import React from "react";
import { useStyles } from "./SearchInput.css";
import { InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export const SearchInput = () => {
  const classes = useStyles();

  return (
    <div className={classes.search}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <InputBase
        disabled={true}
        placeholder="Search…"
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput,
        }}
        inputProps={{ "aria-label": "search" }}
      />
    </div>
  );
};
