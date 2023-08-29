import React from "react";

import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import { KeyboardKey } from "components/styled-components/KeyboardKey";

type InformationBoxProps = {
  description: string;
  name: string;
  hotkey?: string;
};

export const InformationBox = ({
  description,
  name,
  hotkey,
}: InformationBoxProps) => {
  return (
    <AppBar
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0)",
        // borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
        boxShadow: "none",
        position: "absolute",
      }}
      color="default"
    >
      <Toolbar
        sx={{ display: "flex", justifyContent: "space-around" }}
        disableGutters={true}
      >
        <Typography sx={{ ml: 1 }}>{name}</Typography>
        {hotkey && (
          <Box display="flex">
            <KeyboardKey letter="shift" />
            <Typography>+</Typography>
            <KeyboardKey letter={hotkey} />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
