import React from "react";

import { Box, Tooltip } from "@mui/material";

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
