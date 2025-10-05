import { Button, ButtonProps } from "@mui/material";
import { useMemo } from "react";

export const OperationButton = (props: ButtonProps) => {
  const { children, ...styleProps } = useMemo(() => props, [props]);
  return (
    <Button
      size="small"
      sx={{ justifyContent: "flex-start", minWidth: 0 }}
      {...styleProps}
    >
      {children}
    </Button>
  );
};
