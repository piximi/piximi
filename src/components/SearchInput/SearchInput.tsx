import React from "react";
import { InputBase, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export const SearchInput = () => {
  return (
    <Box
      sx={(theme) => ({
        search: {
          position: "relative",
          borderRadius: theme.shape.borderRadius,
          backgroundColor: "#f1f3f4",
          "&:hover": {
            backgroundColor: "#f1f3f4",
          },
          marginRight: theme.spacing(2),
          marginLeft: 0,
          width: "100%",
          [theme.breakpoints.up("sm")]: {
            marginLeft: theme.spacing(3),
            width: "auto",
          },
        },
      })}
    >
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: (theme) => theme.spacing(0, 2),
          pointerEvents: "none",
          position: "absolute",
        }}
      >
        <SearchIcon />
      </Box>
      <InputBase
        disabled={true}
        placeholder="Search…"
        sx={(theme) => ({
          "& .MuiInputBase-root": {
            color: "inherit",
          },
          "& .MuiInputBase-input": {
            padding: theme.spacing(1, 1, 1, 0),
            // vertical padding + font size from searchIcon
            paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
            transition: theme.transitions.create("width"),
            width: "100%",
            [theme.breakpoints.up("md")]: {
              width: "20ch",
            },
          },
        })}
        inputProps={{ "aria-label": "search" }}
      />
    </Box>
  );
};
