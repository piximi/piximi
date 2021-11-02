import React from "react";
import Tooltip from "@mui/material/Tooltip";
import { Box } from "@mui/material";
import { useStyles } from "./AnnotationModeTooltip.css";

type AnnotationModeTooltipProps = {
  children: React.ReactElement;
  content: React.ReactElement;
};

export const AnnotationModeTooltip = ({
  children,
  content,
}: AnnotationModeTooltipProps) => {
  return (
    <Tooltip title={<Box>{content}</Box>} placement="bottom">
      {children}
    </Tooltip>
  );
};
