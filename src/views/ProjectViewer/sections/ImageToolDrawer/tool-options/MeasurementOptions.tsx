import { Box } from "@mui/material";

import { MeasurementsButton } from "@ProjectViewer/components";

export const MeasurementOptions = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
      }}
    >
      <MeasurementsButton />
    </Box>
  );
};
