import React from "react";
import { useNavigate } from "react-router-dom";

import { ArrowBack } from "@mui/icons-material";
import {
  AppBar,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import { LogoLoader } from "components/styled-components";

export const MeasurementsAppBar = () => {
  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    navigate("/");
  };

  return (
    <>
      <AppBar
        color="default"
        sx={{
          boxShadow: "none",
          position: "absolute",
        }}
      >
        <Toolbar sx={{ minHeight: "48px" }}>
          <Tooltip title="Return to project" placement="bottom">
            <IconButton
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
        </Toolbar>
      </AppBar>
    </>
  );
};
