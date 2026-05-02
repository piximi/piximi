import type { ReactNode } from "react";
import React from "react";

import { Chip, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { ArrowForward as ForwardIcon } from "@mui/icons-material";

import type { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const NavChip = ({
  tooltip,
  label,
  labelIcon,
  onClick,
  help,
}: {
  tooltip: string;
  label: string;
  labelIcon?: ReactNode;
  onClick: () => void;
  help: HelpItem;
}) => {
  const theme = useTheme();
  const smOrXsBreakpoint = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Tooltip title={tooltip}>
      <span>
        <Chip
          data-help={help}
          deleteIcon={<ForwardIcon color="inherit" />}
          onDelete={onClick}
          label={smOrXsBreakpoint ? (labelIcon ? labelIcon : "") : label}
          onClick={onClick}
          variant="outlined"
          size="small"
          sx={{
            pl: smOrXsBreakpoint ? 1 : 0,
            "& .MuiChip-label": {
              display: "flex",
              alignItems: "center",
            },
            "& .MuiChip-deleteIcon": {
              color: "inherit",
              ":hover": {
                color: "inherit",
              },
            },
          }}
        />
      </span>
    </Tooltip>
  );
};
