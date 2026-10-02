import { Box, Typography } from "@mui/material";

import type { ReactElement } from "react";

export const SectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: ReactElement;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{
          color: "text.disabled",
          display: "block",
          lineHeight: 1.6,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          height: 0,
          flex: 1,
          mx: 0.5,
          borderBottom: "1px solid var(--mui-palette-divider)",
        }}
      />
      {action && action}
    </Box>
  );
};
