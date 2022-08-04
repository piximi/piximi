import React from "react";
import { useSelector } from "react-redux";

import { AppBar, Box } from "@mui/material";

import { ApplicationToolbar } from "../MainToolbar";
import { AlertDialog } from "components/common/dialogs/AlertDialog/AlertDialog";

import { alertStateSelector } from "store/selectors/";

export const MainAppBar = () => {
  const alertState = useSelector(alertStateSelector);

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

        {alertState.visible && <AlertDialog alertState={alertState} />}
      </AppBar>
    </Box>
  );
};
