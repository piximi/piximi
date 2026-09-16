import { Box, Typography } from "@mui/material";

import { LogoIcon } from "components/ui";

import { DIMENSIONS } from "utils/constants";

export const ImageViewerLogo = () => {
  return (
    <Box
      sx={{
        width: DIMENSIONS.leftDrawerWidth + "px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LogoIcon width={30} height={20} />
      <Typography variant="h6" color={"#02aec5"}>
        Image Viewer
      </Typography>
    </Box>
  );
};
