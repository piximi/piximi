import React from "react";
import { useSelector } from "react-redux";

import { AppBar, Box } from "@mui/material";

import { ApplicationToolbar } from "components/ApplicationToolbar";
import { AlertDialog } from "components/AlertDialog/AlertDialog";

import { alertStateSelector } from "store/selectors/alertStateSelector";

export const ApplicationAppBar = () => {
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
