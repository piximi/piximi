import React, { ReactElement, useState } from "react";

import {
  Card,
  CardActionArea,
  CardContent,
  ListItem,
  ListItemIcon,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";

import { ToolBarToolTitle } from "./ToolBarToolTitle";

type TooltipCardProps = {
  name: string;
  onClose: () => void;
};

type ToolProps = {
  children: React.ReactNode;
  name: string;
  onClick: () => void;
  selected: boolean;
};

const toolTipMap: Record<string, { name: string; letter: string }> = {
  Pointer: { name: "Select annotations", letter: "S" },
  "Rectangular annotation": { name: "Rectangular annotation", letter: "R" },
  "Elliptical annotation": { name: "Elliptical annotation", letter: "E" },
  "Freehand annotation": { name: "Pen annotation", letter: "D" },
  "Lasso annotation (L)": { name: "Lasso annotation", letter: "L" },
  "Polygonal annotation": { name: "Polygonal annotation", letter: "P" },
  "Magnetic annotation": { name: "Magnetic annotation", letter: "M" },
  "Color annotation": { name: "Color annotation", letter: "C" },
  "Quick annotation": { name: "Quick annotation", letter: "Q" },
  "Threshold annotation": { name: "Threshold annotation", letter: "T" },
  Hand: { name: "Hand tool", letter: "H" },
  Zoom: { name: "Zoom tool", letter: "Z" },
  "Color Adjustment": { name: "Color Adjustment", letter: "I" },
};

export const TooltipCard = ({ name, onClose }: TooltipCardProps) => {
  let description: string | ReactElement;

  if (!Object.keys(toolTipMap).includes(name)) {
    if (name === "Object annotation") {
      description =
        "Select a rectangular annotation around a desired object to automatically generate its boundaries.";
    } else {
      description = "";
    }
  } else {
    const tool = toolTipMap[name];
    description = (
      <ToolBarToolTitle toolName={tool.name} letter={tool.letter} />
    );
  }

  return (
    <Card sx={{ width: 210 }} variant="outlined">
      <CardActionArea>
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="span">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export const Tool = ({ children, name, onClick, selected }: ToolProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const onClose = () => {
    setOpen(false);
  };

  const onOpen = () => {
    setOpen(true);
  };

  return (
    <Tooltip
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
      componentsProps={{
        tooltip: {
          sx: { backgroundColor: "transparent", maxWidth: "none" },
        },
      }}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      placement="left"
      title={<TooltipCard name={name} onClose={onClose} />}
    >
      <ListItem button onClick={onClick} selected={selected}>
        <ListItemIcon>
          <SvgIcon fontSize="small">{children}</SvgIcon>
        </ListItemIcon>
      </ListItem>
    </Tooltip>
  );
};
