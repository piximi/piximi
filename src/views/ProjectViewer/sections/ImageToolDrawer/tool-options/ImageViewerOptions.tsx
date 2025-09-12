import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { selectSelectedKindItems } from "store/project/selectors";
//import { selectSelectedThingIds } from "store/project/selectors";

export const ImageViewerOptions = () => {
  const navigate = useNavigate();
  const selectedThingIds = useSelector(selectSelectedKindItems);
  const handleNavigateImageViewer = () => {
    navigate("/imageviewer", {
      state: {
        initialThingIds: selectedThingIds,
      },
    });
  };
  return (
    <Stack justifyContent="center" alignItems="center">
      {Object.keys(selectedThingIds).length === 0 && (
        <Typography variant="body2">
          Select images or objects to view.
        </Typography>
      )}
      <Button
        variant="text"
        disabled={Object.keys(selectedThingIds).length === 0}
        onClick={handleNavigateImageViewer}
      >
        Go to ImageViewer
      </Button>
    </Stack>
  );
};
