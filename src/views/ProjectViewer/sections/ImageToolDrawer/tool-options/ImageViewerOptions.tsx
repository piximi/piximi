import React from "react";

import { useSelector } from "react-redux";

import { Stack, Typography } from "@mui/material";

import { selectActiveSelectedIds } from "@ProjectViewer/state/selectors";
import { ImageViewerButton } from "@ProjectViewer/components";

export const ImageViewerOptions = () => {
  const selectedThingIds = useSelector(selectActiveSelectedIds);

  return (
    <Stack justifyContent="center" alignItems="center">
      {selectedThingIds.length === 0 ? (
        <Typography variant="body2">
          Select images or objects to view.
        </Typography>
      ) : (
        <ImageViewerButton selectedThings={selectedThingIds} />
      )}
    </Stack>
  );
};
