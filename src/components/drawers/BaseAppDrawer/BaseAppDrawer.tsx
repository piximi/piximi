import React from "react";
import { Box, Divider, Drawer } from "@mui/material";
import { ApplicationOptionsList } from "components/lists";

export const BaseAppDrawer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Drawer
      anchor="left"
      sx={{
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
      <Box sx={{ overflowY: "scroll" }}>{children}</Box>
      <Divider />
      <ApplicationOptionsList />
    </Drawer>
  );
};
