import { useNavigate } from "react-router-dom";

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { LogoIcon } from "components/ui";

export const MeasurementsLogo = () => {
  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    navigate("/project");
  };

  return (
    <Box sx={{ pl: 1, display: "flex", alignItems: "center", gap: 1 }}>
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
      <LogoIcon width={24} height={24} />
      <Typography variant="h5" color={"#02aec5"} fontSize="1.4rem">
        Measurements
      </Typography>
    </Box>
  );
};
