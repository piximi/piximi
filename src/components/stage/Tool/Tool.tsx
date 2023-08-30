import React from "react";

import { ListItem, ListItemIcon, SvgIcon } from "@mui/material";

import { ToolHotkeyTitle, TooltipCard } from "components/tooltips";

type ToolProps = {
  children: React.ReactNode;
  name: string;
  onClick: () => void;
};

export const Tool = ({ children, name, onClick }: ToolProps) => {
  let toolName = name;

  const description = <ToolHotkeyTitle toolName={toolName} />;

  return (
    <TooltipCard description={description}>
      <ListItem button onClick={onClick}>
        <ListItemIcon>
          <SvgIcon fontSize="small">{children}</SvgIcon>
        </ListItemIcon>
      </ListItem>
    </TooltipCard>
  );
};
