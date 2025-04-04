import { Typography, TypographyProps, Stack, FormControl } from "@mui/material";
import React from "react";

export const WithLabel = ({
  label,
  labelProps,
  children,
}: {
  label: string;
  labelProps: Omit<TypographyProps, "children">;
  children: React.ReactChild;
}) => {
  return (
    <Stack direction="row" sx={{ alignItems: "center" }}>
      <Typography {...labelProps}>{label}</Typography>
      <FormControl sx={{ width: "auto" }}>{children}</FormControl>
    </Stack>
  );
};
