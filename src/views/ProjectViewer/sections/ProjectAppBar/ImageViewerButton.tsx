import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Tooltip } from "@mui/material";
import { Gesture as GestureIcon } from "@mui/icons-material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ImageViewerButton = ({
  selectedThings,
}: {
  selectedThings: string[];
}) => {
  const navigate = useNavigate();
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
          data-help={HelpItem.NavigateImageViewer}
          avatar={<GestureIcon color="inherit" />}
          label="Annotate"
          onClick={handleNavigateImageViewer}
          variant="outlined"
          sx={{ marginRight: 1 }}
          disabled={selectedThings.length === 0}
        />
      </span>
    </Tooltip>
  );
};
