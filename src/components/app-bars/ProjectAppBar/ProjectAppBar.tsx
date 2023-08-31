import React from "react";
import { useSelector } from "react-redux";

import { AppBar, Box } from "@mui/material";

import { ProjectToolbar } from "../ProjectToolbar";

import { AlertDialog } from "components/dialogs";

import { selectAlertState } from "store/application";
import { APPLICATION_COLORS } from "utils/common/colorPalette";

export const ProjectAppBar = () => {
  const alertState = useSelector(selectAlertState);

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
        <ProjectToolbar />

        {alertState.visible && <AlertDialog alertState={alertState} />}
      </AppBar>
    </Box>
  );
};
