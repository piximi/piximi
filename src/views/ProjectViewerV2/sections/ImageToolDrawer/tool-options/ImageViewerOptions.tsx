import React from "react";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { Button, Stack, Typography } from "@mui/material";

import { selectActiveSelectedIds } from "@ProjectViewer/state/selectors";

export const ImageViewerOptions = () => {
  const navigate = useNavigate();
  const selectedThingIds = useSelector(selectActiveSelectedIds);
  const handleNavigateImageViewer = () => {
    navigate("/imageviewer", {
      state: {
        initialThingIds: selectedThingIds,
      },
    });
  };
  return (
    <Stack justifyContent="center" alignItems="center">
      {selectedThingIds.length === 0 && (
        <Typography variant="body2">
          Select images or objects to view.
        </Typography>
      )}
      <Button
        variant="text"
        disabled={selectedThingIds.length === 0}
        onClick={handleNavigateImageViewer}
      >
        Go to ImageViewer
      </Button>
    </Stack>
  );
};
