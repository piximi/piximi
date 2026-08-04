import { Box, Typography } from "@mui/material";

import { LogoLoader } from "components/ui";

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
      <LogoLoader width={30} height={20} loadPercent={1} fullLogo={false} />
      <Typography variant="h6" color={"#02aec5"}>
        Image Viewer
      </Typography>
    </Box>
  );
};
