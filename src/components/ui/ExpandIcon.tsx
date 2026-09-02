import { ExpandLess as ExpandLessIcon } from "@mui/icons-material";
import type { SxProps } from "@mui/material";

export const ExpandIcon = (props: { expanded: boolean; sx?: SxProps }) => {
  return (
    <ExpandLessIcon
      sx={{ ...props.sx, transform: `rotate(${props.expanded ? 0 : 180}deg)` }}
    />
  );
};
