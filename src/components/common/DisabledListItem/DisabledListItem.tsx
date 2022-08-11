import React from "react";

import { ListItem, Tooltip } from "@mui/material";

type DisabledClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
  children?: React.ReactNode;
};

export const DisabledListItem = ({
  disabled,
  helperText,
  children,
}: DisabledClassifierListItemProps) => {
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
      title={disabled ? helperText : ""}
      placement="right"
      arrow
    >
      <ListItem disabled={disabled}>{children}</ListItem>
    </Tooltip>
  );
};
