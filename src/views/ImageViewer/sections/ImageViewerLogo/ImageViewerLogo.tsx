import { Stack, Typography } from "@mui/material";

import { LogoLoader } from "components/ui";
import { DIMENSIONS } from "utils/constants";

export const ImageViewerLogo = () => {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      minWidth={DIMENSIONS.leftDrawerWidth}
    >
      <LogoLoader width={30} height={20} loadPercent={1} fullLogo={false} />
      <Typography variant="h6" color={"#02aec5"}>
        Image Viewer
      </Typography>
    </Stack>
  );
};
