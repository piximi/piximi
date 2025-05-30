import React from "react";
import { useNavigate } from "react-router-dom";

import { IconButton, Tooltip, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

import { LogoLoader } from "components/ui";
import { CustomAppBar } from "components/layout";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const MeasurementsAppBar = () => {
  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    navigate("/project");
  };

  return (
    <CustomAppBar>
      <Tooltip title="Return to project" placement="bottom">
        <IconButton
          data-help={HelpItem.NavigateProjectView}
          edge="start"
          onClick={onReturnToMainProject}
          aria-label="Exit Measurements"
          href={""}
        >
          <ArrowBack />
        </IconButton>
      </Tooltip>
      <LogoLoader width={30} height={30} loadPercent={1} fullLogo={false} />
      <Typography variant="h5" color={"#02aec5"} fontSize="1.4rem">
        Measurements
      </Typography>
    </CustomAppBar>
  );
};
