import React from "react";
import { ApplicationToolbar } from "../ApplicationToolbar";
import { AppBar, Box } from "@mui/material";

export const ApplicationAppBar = () => {
  return (
    <Box>
      <AppBar
        sx={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "none",
        }}
        color="inherit"
        position="fixed"
      >
        <ApplicationToolbar />
      </AppBar>
    </Box>
  );
};
