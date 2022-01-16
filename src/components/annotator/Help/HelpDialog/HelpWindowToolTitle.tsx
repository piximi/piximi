import Typography from "@mui/material/Typography";
import { KeyboardKey } from "./KeyboardKey";
import React from "react";
import { HelpWindowToolIcon } from "./HelpWindowToolIcons";
import { Box } from "@mui/material";

type ToolTitleProps = {
  toolName: string;
  letter: string;
  children: React.ReactNode;
};
export const HelpWindowToolTitle = ({
  children,
  toolName,
  letter,
}: ToolTitleProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <HelpWindowToolIcon>{children}</HelpWindowToolIcon>
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
