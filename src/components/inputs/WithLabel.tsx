import { Typography, TypographyProps, Stack, FormControl } from "@mui/material";
import React, { CSSProperties } from "react";

export const WithLabel = ({
  label,
  labelProps,
  children,
  fullWidth,
  sx,
}: {
  label: string;
  labelProps: Omit<TypographyProps, "children">;
  children: React.ReactChild;
  fullWidth?: boolean;
  sx?: CSSProperties;
}) => {
  return (
    <Stack
      direction="row"
      sx={{
        ...{ alignItems: "center", width: fullWidth ? "100%" : undefined },
        ...sx,
      }}
    >
      <Typography {...labelProps}>{label}</Typography>
      <FormControl sx={fullWidth ? {} : { width: "auto" }} fullWidth>
        {children}
      </FormControl>
    </Stack>
  );
};
