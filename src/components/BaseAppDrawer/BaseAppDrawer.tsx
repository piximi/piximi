import React from "react";
import { Box, Drawer } from "@mui/material";
import { ApplicationOptions } from "components/ApplicationOptions";

export const BaseAppDrawer = ({
  children,
  mobile,
}: {
  children: React.ReactNode;
  mobile?: boolean;
}) => {
  return (
    <Drawer
      anchor="left"
      sx={{
        display: mobile ? "none" : "block",
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        overflow: "hidden",
        "& > 	.MuiDrawer-paper": {
          zIndex: 99,
          width: (theme) => theme.spacing(32),
          height: "100vh",
          overflow: "hidden",
        },
      }}
      open
      variant="persistent"
    >
      <Box sx={{ overflowY: "scroll", overflowX: "hidden" }}>{children}</Box>

      <ApplicationOptions />
    </Drawer>
  );
};
