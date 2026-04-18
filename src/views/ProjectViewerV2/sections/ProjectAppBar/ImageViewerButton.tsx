import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Gesture as GestureIcon } from "@mui/icons-material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ImageViewerButton = ({
  selectedThings,
}: {
  selectedThings: string[];
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const smOrXsBreakpoint = useMediaQuery(theme.breakpoints.down("md"));
  const handleNavigateImageViewer = () => {
    navigate("/imageviewer", {
      state: {
        initialThingIds: selectedThings,
      },
    });
  };
  return (
    <Tooltip
      title={
        selectedThings.length === 0
          ? "Select Objects to Annotate"
          : "Annotate Selection"
      }
    >
      <span>
        <Chip
          data-testid="annotate-button"
          data-help={HelpItem.NavigateImageViewer}
          avatar={<GestureIcon color="inherit" />}
          label={smOrXsBreakpoint ? "" : "Annotate"}
          onClick={handleNavigateImageViewer}
          variant="outlined"
          sx={{ marginRight: 1, pl: smOrXsBreakpoint ? 1 : 0 }}
          disabled={selectedThings.length === 0}
          size="small"
        />
      </span>
    </Tooltip>
  );
};
