import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { projectSlice } from "@ProjectViewer/state";
import { selectImageAnnotationStatusFilter } from "@ProjectViewer/state/selectors";

import type { MouseEvent } from "react";

import type { AnnotationStatusFilter as AnnotationStatus } from "@ProjectViewer/state/types";

export const AnnotationStatusFilter = () => {
  const dispatch = useDispatch();
  const annotationStatus = useSelector(selectImageAnnotationStatusFilter);

  const handleStatusChange = (
    _event: MouseEvent<HTMLElement>,
    status: AnnotationStatus | null,
  ) => {
    // null arrives when the active button is clicked again; keep the current value
    if (!status) return;
    dispatch(projectSlice.actions.setImageAnnotationStatusFilter(status));
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        mt: 2,
      }}
    >
      <Typography variant="body2">Show</Typography>
      <ToggleButtonGroup
        exclusive
        value={annotationStatus}
        onChange={handleStatusChange}
        size="small"
        sx={{
          height: 20,
          "& .MuiButtonBase-root": {
            px: 1,
            py: 0,
            fontSize: "0.65rem",
            lineHeight: 1,
          },
        }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="annotated">Annotated</ToggleButton>
        <ToggleButton value="unannotated">Unannotated</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
