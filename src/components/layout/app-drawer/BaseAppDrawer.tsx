import type React from "react";

import { Box, Drawer, Stack } from "@mui/material";

import { DIMENSIONS } from "utils/constants";

import { ApplicationOptions } from "./ApplicationOptions";

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
        width: DIMENSIONS.leftDrawerWidth,
        overflow: "hidden",
        "& > .MuiDrawer-paper": {
          zIndex: 99,
          width: DIMENSIONS.leftDrawerWidth,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        },
      }}
      open
      variant="persistent"
    >
      <Stack
        sx={{ position: "relative", height: "100%", minHeight: 0 }}
        justifyContent={"space-between"}
      >
        <Box sx={{ overflowY: "scroll", overflowX: "hidden" }}>{children}</Box>

        {!hideSettings && <ApplicationOptions />}
      </Stack>
    </Drawer>
  );
};
