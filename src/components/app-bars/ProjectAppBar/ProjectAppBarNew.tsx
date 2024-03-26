import React from "react";
import { useSelector } from "react-redux";

import { AppBar, Box } from "@mui/material";

import { AlertBar } from "components/app-bars";

import { selectAlertState } from "store/slices/applicationSettings";
import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { ProjectToolbarNew } from "../ProjectToolbar/ProjectToolbarNew";

export const ProjectAppBarNew = () => {
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
        <ProjectToolbarNew />

        {alertState.visible && <AlertBar alertState={alertState} />}
      </AppBar>
    </Box>
  );
};
