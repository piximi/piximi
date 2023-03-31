import React from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  SxProps,
  ListItemButton,
} from "@mui/material";
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";

type CollapsibleListProps = {
  children: any;
  dense: boolean;
  primary: string;
  closed?: boolean;
  backgroundColor?: string;
  disablePadding?: boolean;
  paddingLeft?: boolean;
  sx?: SxProps;
  onScroll?: (evt: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  secondary?: JSX.Element;
  disabled?: boolean;
};

export const CollapsibleList = ({
  children,
  dense,
  closed,
  backgroundColor,
  primary,
  disablePadding,
  paddingLeft,
  sx,
  onScroll,
  secondary,
  disabled,
}: CollapsibleListProps) => {
  const [collapsed, setCollapsed] = React.useState(closed);

  const handleClick = () => {
    setCollapsed(!collapsed);
  };

  React.useEffect(() => {
    console.log(closed);
    console.log(collapsed);
  });

  return (
    <List
      sx={{ backgroundColor: backgroundColor ? backgroundColor : "" }}
      dense={dense}
    >
      <ListItem secondaryAction={secondary}>
        <ListItemButton
          role={undefined}
          onClick={handleClick}
          disableGutters
          disabled={disabled}
        >
          <ListItemIcon>
            {!collapsed ? (
              <KeyboardArrowDownIcon />
            ) : (
              <KeyboardArrowRightIcon />
            )}
          </ListItemIcon>

          <ListItemText primary={primary} />
        </ListItemButton>
      </ListItem>

      <Collapse
        in={!collapsed}
        timeout="auto"
        unmountOnExit
        sx={{ paddingLeft: paddingLeft ? "2rem" : "auto" }}
      >
        <List
          component="div"
          dense={dense}
          disablePadding={disablePadding}
          sx={sx}
          onScroll={onScroll}
        >
          {children}
        </List>
      </Collapse>
    </List>
  );
};
