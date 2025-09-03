import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Gesture as GestureIcon } from "@mui/icons-material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { useSelector } from "react-redux";
import { selectAllSelectedKindItems } from "store/project/selectors";

export const ImageViewerButton = () => {
  const selectedKindItems = useSelector(selectAllSelectedKindItems);
  const navigate = useNavigate();
  const theme = useTheme();
  const smOrXsBreakpoint = useMediaQuery(theme.breakpoints.down("md"));
  const handleNavigateImageViewer = () => {
    navigate("/imageviewer", {
      state: {
        initialThingIds: selectedKindItems,
      },
    });
  };
  return (
    <Tooltip
      title={
        selectedKindItems.images.length === 0 &&
        selectedKindItems.annotations.length === 0
          ? "Select Objects to Annotate"
          : "Annotate Selection"
      }
    >
      <span>
        <Chip
          data-help={HelpItem.NavigateImageViewer}
          avatar={<GestureIcon color="inherit" />}
          label={smOrXsBreakpoint ? "" : "Annotate"}
          onClick={handleNavigateImageViewer}
          variant="outlined"
          sx={{ marginRight: 1, pl: smOrXsBreakpoint ? 1 : 0 }}
          disabled={
            selectedKindItems.images.length === 0 &&
            selectedKindItems.annotations.length === 0
          }
          size="small"
        />
      </span>
    </Tooltip>
  );
};
