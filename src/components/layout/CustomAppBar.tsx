import React from "react";
import { AppBar, Toolbar, ToolbarProps } from "@mui/material";

import { APPLICATION_COLORS } from "utils/constants";

export const CustomAppBar = ({
  children,
  toolbarProps,
}: {
  children: React.ReactNode;
  toolbarProps?: ToolbarProps;
}) => {
  return (
    <AppBar
      color="default"
      position="absolute"
      sx={{
        borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
        boxShadow: "none",
      }}
    >
      <Toolbar {...toolbarProps}>{children}</Toolbar>
    </AppBar>
  );
};
