import Typography from "@mui/material/Typography";
import React from "react";
import { KeyboardKey } from "components/common/Help/HelpDialog/KeyboardKey";
import { Box } from "@mui/material";

type ToolTitleProps = {
  toolName: string;
  letter: string;
};
export const ToolBarToolTitle = ({ toolName, letter }: ToolTitleProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography>{toolName}</Typography>
      <Typography style={{ marginLeft: "5px" }}>(</Typography>
      <KeyboardKey letter="shift" />
      <Typography>+</Typography>
      <KeyboardKey letter={letter} />
      <Typography>)</Typography>
    </Box>
  );
};
