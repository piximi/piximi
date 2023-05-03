import React from "react";

import { Box, Typography } from "@mui/material";

import { KeyboardKey } from "./KeyboardKey";

export type ToolTitleProps = {
  toolName: string;
  letter: string;
};

export const HelpWindowToolTitle = ({ toolName, letter }: ToolTitleProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography>
        <Box fontWeight="fontWeightBold">{toolName}</Box>
      </Typography>
      <Typography style={{ marginLeft: "5px" }}>(</Typography>
      <KeyboardKey letter="shift" />
      <Typography>+</Typography>
      <KeyboardKey letter={letter} />
      <Typography>)</Typography>
    </Box>
  );
};
