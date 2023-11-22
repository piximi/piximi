import React from "react";
import { Checkbox } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";
import { Category } from "types";

export const LabelChackbox = ({
  isChecked,
  color,
  onChange,
}: {
  isChecked: boolean;
  color: string;
  onChange: (category: Category) => void;
}) => {
  return (
    <Checkbox
      checked={isChecked}
      checkedIcon={<LabelIcon />}
      disableRipple
      edge="start"
      sx={{
        color: color,
        py: 0,
        "&.Mui-checked": { color: color },
      }}
      icon={<LabelOutlinedIcon />}
      tabIndex={-1}
      onChange={() => {}}
      size="small"
    />
  );
};
