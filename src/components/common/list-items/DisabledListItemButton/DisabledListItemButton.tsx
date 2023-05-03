import React from "react";

import { ListItemButton, Tooltip } from "@mui/material";

type DisabledClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export const DisabledListItemButton = ({
  disabled,
  helperText,
  onClick,
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
      placement="bottom"
      arrow
    >
      <div>
        <ListItemButton disabled={disabled} onClick={onClick}>
          {children}
        </ListItemButton>
      </div>
    </Tooltip>
  );
};
