import type React from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { projectSlice } from "@ProjectViewer/state";
import { selectActiveView } from "@ProjectViewer/state/selectors";
import { selectTotalAnnotations } from "store/dataV2/selectors";

import { DIMENSIONS } from "utils/constants";

import { ImageGrid } from "./ImageGrid";
import { AnnotationView } from "./AnnotationView";
import { GridActions } from "./GridActions/GridActions";

import type { ViewState } from "@ProjectViewer/state/types";

export const ProjectGrid = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveView);
  const annotationCount = useSelector(selectTotalAnnotations);

  const handleActiveViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: ViewState,
  ) => {
    dispatch(projectSlice.actions.setActiveView(value));
  };

  return (
    <Box
      sx={(theme) => ({
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gridArea: "image-grid",
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        flexGrow: 1,
        borderRadius: "4px 4px 0 0",
      })}
    >
      <Box
        sx={(theme) => ({
          width: "100%",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: DIMENSIONS.toolDrawerWidth,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <ToggleButtonGroup
          data-help={HelpItem.GridView}
          value={activeView}
          size="small"
          color="primary"
          exclusive
          onChange={handleActiveViewChange}
          sx={{ my: 0.5 }}
        >
          <ToggleButton value="images">Images</ToggleButton>
          <ToggleButton value="annotations" disabled={annotationCount === 0}>
            Annotations
          </ToggleButton>
        </ToggleButtonGroup>
        <GridActions viewState={activeView} />
      </Box>
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          display: activeView === "images" ? "block" : "none",
        }}
      >
        <ImageGrid />
      </Box>
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          display: activeView === "annotations" ? "flex" : "none",
        }}
      >
        <AnnotationView />
      </Box>
    </Box>
  );
};
