import React from "react";
import { Chip } from "@mui/material";

export const CountChip = ({
  count,
  backgroundColor,
}: {
  count: number;
  backgroundColor: string;
}) => {
  return (
    <Chip
      label={count}
      size="small"
      sx={(theme) => {
        return {
          height: "1.5em",
          minWidth: "2.5em",
          borderWidth: "2px",
          fontSize: "0.875rem",
          color: theme.palette.text.primary,
          backgroundColor: backgroundColor,
        };
      }}
    />
  );
};
