import { Box, Typography } from "@mui/material";
import React from "react";
import { KeyboardKey } from "../Help/HelpDialog/KeyboardKey";
type ToolHotkeyTitleProps = {
  toolName: string;
  letter?: string;
  bold?: boolean;
};
export const ToolHotkeyTitle = ({
  toolName,
  letter,
  bold,
}: ToolHotkeyTitleProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography
        fontWeight={bold ? "fontWeightBold" : ""}
        fontSize={"0.875rem"}
      >
        {toolName}
      </Typography>
      {letter && (
        <>
          <Typography style={{ marginLeft: "5px" }}>(</Typography>
          <KeyboardKey letter="shift" />
          <Typography>+</Typography>
          <KeyboardKey letter={letter} />
          <Typography>)</Typography>
        </>
      )}
    </Box>
  );
};
