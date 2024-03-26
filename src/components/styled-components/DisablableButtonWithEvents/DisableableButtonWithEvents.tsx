import { Button, ButtonProps } from "@mui/material";
import React from "react";

type DisableableButtonWithEventsProps = Omit<ButtonProps, "disabled"> & {
  disabled?: boolean;
};

export const DisableableButtonWithEvents = ({
  disabled,
  ...rest
}: DisableableButtonWithEventsProps) => {
  return (
    <Button
      {...rest}
      onClick={disabled ? undefined : rest.onClick}
      sx={(theme) => ({
        ...rest.sx,
        ...(disabled && {
          color: theme.palette.action.disabled,
          ":hover": { backgroundColor: "inherit", cursor: "default" },
        }),
      })}
    />
  );
};
