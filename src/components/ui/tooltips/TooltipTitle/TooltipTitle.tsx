import { Box, Typography } from "@mui/material";

import { KeyboardKey } from "components/ui/KeyboardKey";

export const TooltipTitle = (
  tooltip: string,
  firstKey: string,
  secondKey?: string
) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", typography: "caption" }}>
      <Typography variant="caption">{tooltip}</Typography>
      <Typography variant="caption" style={{ marginLeft: "5px" }}>
        (
      </Typography>
      {secondKey && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            typography: "caption",
          }}
        >
          <KeyboardKey letter={firstKey} />
          <Typography variant="caption">+</Typography>
        </Box>
      )}
      <KeyboardKey letter={secondKey ? secondKey : firstKey} />
      <Typography variant="caption">)</Typography>
    </Box>
  );
};
