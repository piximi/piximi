import React from "react";
import { Tooltip } from "@mui/material";

export const ItemDetailTooltip = ({
  contents,
  color,
  children,
}: {
  contents: JSX.Element;
  color: string | undefined;
  children: JSX.Element;
}) => {
  return (
    <Tooltip
      title={contents}
      placement="right"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            borderRadius: 2,
            backgroundColor: color,
          },
        },
        arrow: {
          sx: {
            color: color,
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
};
