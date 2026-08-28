import { Box, Divider, Typography } from "@mui/material";

import { PivotConfigurator } from "./PivotConfigurator";

export const SplitOptions = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        border: `1px solid rgba(23, 23, 23, 1)`,
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Box sx={{ height: "38px" }}>
        <Typography variant="h6" sx={{ px: 1, py: 0.5, fontSize: "1rem" }}>
          Split Options
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(23, 23, 23, 1)" }} />
      <Box
        sx={(theme) => ({
          width: "100%",
          height: "100%",
          overflow: "scroll",
          bgcolor: theme.palette.background.paper.slice(0, -1) + ",0.7)",
        })}
      >
        <PivotConfigurator />
      </Box>
    </Box>
  );
};
