import React from "react";
import { useSelector } from "react-redux";

import { AppBar, Box } from "@mui/material";

import { MainToolbar } from "../MainToolbar";

import { AlertDialog } from "components/common/AlertDialog/AlertDialog";

import { alertStateSelector } from "store/application";
import { APPLICATION_COLORS } from "utils/common/colorPalette";

export const MainAppBar = () => {
  const alertState = useSelector(alertStateSelector);

  return (
    <Box>
      <AppBar
        sx={{
          borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
          boxShadow: "none",
        }}
        color="inherit"
        position="fixed"
      >
        <MainToolbar />

        {alertState.visible && <AlertDialog alertState={alertState} />}
      </AppBar>
    </Box>
  );
};
