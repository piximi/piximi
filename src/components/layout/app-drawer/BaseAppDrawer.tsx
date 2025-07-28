import React from "react";
import { Box, Drawer, Stack } from "@mui/material";

import { ApplicationOptions } from "components/layout/app-drawer/ApplicationOptions";

export const BaseAppDrawer = ({
  children,
  mobile,
  hideSettings,
}: {
  children: React.ReactNode;
  mobile?: boolean;
  hideSettings?: boolean;
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
          height: "100%",
          overflow: "hidden",
          position: "relative",
        },
      }}
      open
      variant="persistent"
    >
      <Stack
        sx={{ position: "relative", height: "100%" }}
        justifyContent={"space-between"}
      >
        <Box sx={{ overflowY: "scroll", overflowX: "hidden" }}>{children}</Box>
        {!hideSettings && <ApplicationOptions />}
      </Stack>
    </Drawer>
  );
};
