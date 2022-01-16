import React from "react";
import { Typography } from "@mui/material";

export const Logo = () => {
  return (
    <Typography
      sx={(theme) => ({
        display: "none",
        [theme.breakpoints.up("sm")]: {
          display: "block",
        },
      })}
      color="inherit"
      noWrap
      variant="h6"
    >
      Piximi
    </Typography>
  );
};
