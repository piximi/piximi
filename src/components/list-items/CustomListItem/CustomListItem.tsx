import React, { ReactElement } from "react";

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemProps,
  ListItemTextProps,
  Tooltip,
} from "@mui/material";

type CustomLiteItemProps = Pick<
  ListItemProps,
  "alignItems" | "divider" | "disableGutters" | "dense" | "disablePadding"
> &
  Pick<ListItemTextProps, "primaryTypographyProps"> & {
    primaryText: string | ReactElement;
    icon?: ReactElement;
    tooltipText?: string | ReactElement;
  };

export const CustomListItem = ({
  primaryText,
  icon,
  primaryTypographyProps,
  tooltipText,
  ...rest
}: CustomLiteItemProps) => {
  return (
    <Tooltip
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
      componentsProps={{
        tooltip: {
          sx: { backgroundColor: "#565656", fontSize: "0.85rem" },
        },
        arrow: { sx: { color: "#565656" } },
      }}
      title={tooltipText}
      placement="bottom"
      disableInteractive
      enterDelay={500}
      enterNextDelay={500}
      arrow
    >
      <ListItem {...rest}>
        {icon && <ListItemIcon>{icon}</ListItemIcon>}

        <ListItemText
          primary={primaryText}
          primaryTypographyProps={primaryTypographyProps}
        />
      </ListItem>
    </Tooltip>
  );
};
