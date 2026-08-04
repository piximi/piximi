import { useNavigate } from "react-router-dom";

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

import { LogoLoader } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const MeasurementsLogo = () => {
  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    navigate("/project");
  };

  return (
    <Box sx={{ pl: 1, display: "flex", alignItems: "center" }}>
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
      <LogoLoader width={24} height={24} loadPercent={1} fullLogo={false} />
      <Typography variant="h5" color={"#02aec5"} fontSize="1.4rem">
        Measurements
      </Typography>
    </Box>
  );
};
