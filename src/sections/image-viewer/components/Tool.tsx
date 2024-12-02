import React from "react";

import { ListItemButton, ListItemIcon, SvgIcon } from "@mui/material";

import { ToolHotkeyTitle, TooltipCard } from "components/UI_/tooltips";

type ToolProps = {
  children: React.ReactNode;
  name: string;
  onClick: () => void;
  onTouch: () => void;
};

//TODO: tool buttons

export const Tool = ({
  children,
  name,
  onClick: handleClick,
  onTouch: handleTouch,
}: ToolProps) => {
  let toolName = name;

  const description = <ToolHotkeyTitle toolName={toolName} />;

  return (
    <>
      <TooltipCard description={description}>
        <ListItemButton onClick={handleClick}>
          <ListItemIcon>
            <SvgIcon fontSize="small">{children}</SvgIcon>
          </ListItemIcon>
        </ListItemButton>
      </TooltipCard>
    </>
  );
};
