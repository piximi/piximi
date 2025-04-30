import { Typography, TypographyProps, Stack, FormControl } from "@mui/material";
import React from "react";

export const WithLabel = ({
  label,
  labelProps,
  children,
  fullWidth,
}: {
  label: string;
  labelProps: Omit<TypographyProps, "children">;
  children: React.ReactChild;
  fullWidth?: boolean;
}) => {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", width: fullWidth ? "100%" : undefined }}
    >
      <Typography {...labelProps}>{label}</Typography>
      <FormControl sx={{ width: "auto" }} fullWidth>
        {children}
      </FormControl>
    </Stack>
  );
};
