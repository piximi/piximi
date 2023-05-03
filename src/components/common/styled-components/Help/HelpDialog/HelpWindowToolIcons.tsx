import React from "react";

import SvgIcon from "@mui/material/SvgIcon";

type ToolProps = {
  children: React.ReactNode;
};
export const HelpWindowToolIcon = ({ children }: ToolProps) => {
  return (
    <SvgIcon sx={{ marginRight: "8px " }} fontSize="small">
      {children}
    </SvgIcon>
  );
};
