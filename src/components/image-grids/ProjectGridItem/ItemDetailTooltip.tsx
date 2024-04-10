import React from "react";
import { Tooltip } from "@mui/material";

export const ItemDetailTooltip = ({
  contents,
  backgroundColor,
  children,
}: {
  contents: JSX.Element;
  backgroundColor: string;
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
            backgroundColor: backgroundColor,
          },
        },
        arrow: {
          sx: {
            color: backgroundColor,
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
};
