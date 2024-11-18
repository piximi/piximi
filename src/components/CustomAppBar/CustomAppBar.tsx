import React from "react";
import { AppBar, Toolbar } from "@mui/material";

import { APPLICATION_COLORS } from "utils/common/constants";

export const CustomAppBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppBar
      color="default"
      position="absolute"
      sx={{
        borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
        boxShadow: "none",
      }}
    >
      <Toolbar>{children}</Toolbar>
    </AppBar>
  );
};
