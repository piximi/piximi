import type { ReactNode } from "react";
import React from "react";

import { Tooltip } from "@mui/material";

export const ItemDetailTooltip = ({
  contents,
  backgroundColor,
  children,
}: {
  contents: ReactNode;
  backgroundColor: string;
  children: JSX.Element;
}) => {
  return (
    <Tooltip
      title={contents}
      placement="right"
      arrow
      slotProps={{
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
