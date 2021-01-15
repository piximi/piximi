import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import Tooltip from "@material-ui/core/Tooltip";

type ImageViewerProps = {
  children: React.ReactNode;
  name: string;
  onClick: () => void;
  selected: boolean;
};

export const Operation = ({
  children,
  name,
  onClick,
  selected,
}: ImageViewerProps) => {
  return (
    <Tooltip aria-label={name} title={name}>
      <ListItem button onClick={onClick} selected={selected}>
        <ListItemIcon>
          <SvgIcon fontSize="small">{children}</SvgIcon>
        </ListItemIcon>
      </ListItem>
    </Tooltip>
  );
};
