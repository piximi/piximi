import { Box } from "@mui/material";

import { imageStyle } from "./gridItemUtils";
import { useGridItemStyle } from "./useGridItemStyle";

/* A cell whose record has not arrived yet. */
export const GridPlaceholder = () => {
  const { containerStyle } = useGridItemStyle(false);
  return (
    <Box sx={containerStyle}>
      <Box
        sx={(theme) => ({
          ...imageStyle,
          border: `1px dashed ${theme.palette.divider}`,
        })}
      />
    </Box>
  );
};
