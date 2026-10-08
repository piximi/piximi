import { Typography, Stack, FormControl } from "@mui/material";

import type { ReactChild } from "react";

import type { SystemStyleObject } from "@mui/system";
import type { TypographyProps } from "@mui/material";

import type { HTMLDataAttributes } from "utils/types";

export const WithLabel = ({
  label,
  labelProps,
  children,
  fullWidth,
  sx,
  ...attributes
}: HTMLDataAttributes & {
  label: string;
  labelProps: Omit<TypographyProps, "children">;
  children: ReactChild;
  fullWidth?: boolean;
  sx?: SystemStyleObject;
}) => {
  return (
    <Stack
      direction="row"
      sx={{
        ...{ alignItems: "center", width: fullWidth ? "100%" : undefined },
        ...sx,
      }}
    >
      <Typography {...attributes} {...labelProps}>
        {label}
      </Typography>
      <FormControl sx={fullWidth ? {} : { width: "auto" }} fullWidth>
        {children}
      </FormControl>
    </Stack>
  );
};
