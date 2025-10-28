import { Button, ButtonProps } from "@mui/material";
import { useMemo } from "react";

export const OperationButton = (props: ButtonProps) => {
  const {
    children,
    sx: styleProps,
    ...componentProps
  } = useMemo(() => props, [props]);
  return (
    <Button
      size="small"
      sx={{ justifyContent: "flex-start", minWidth: 0, ...styleProps }}
      {...componentProps}
    >
      {children}
    </Button>
  );
};
