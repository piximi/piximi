import React from "react";

import { Box, Divider, Typography } from "@mui/material";

import { ImageList } from "./ImageList";

export const ImageSection = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="h6" gutterBottom={false}>
        Images
      </Typography>
      <Divider flexItem orientation="horizontal" />
      <ImageList />
    </Box>
  );
};
