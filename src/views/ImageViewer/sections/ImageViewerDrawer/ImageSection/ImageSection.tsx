import { Box, Divider, Typography } from "@mui/material";

import { ImageList } from "./ImageList";
import { ChannelList } from "./ChannelList";

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
      <Typography variant="h6" gutterBottom={false} sx={{ fontSize: 16 }}>
        Images
      </Typography>
      <Divider flexItem orientation="horizontal" />
      <ImageList />
      <Divider flexItem orientation="horizontal" />
      <ChannelList />
    </Box>
  );
};
