import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import React, { ReactElement, useState } from "react";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { Card, CardActionArea, CardContent, Tooltip } from "@mui/material";
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

export const TooltipCard = ({ name, onClose }: TooltipCardProps) => {
  let description: string | ReactElement;

  switch (name) {
    case "Pointer":
      description = (
        <ToolBarToolTitle toolName={"Select annotations"} letter={"S"} />
      );
      break;
    case "Rectangular annotation":
      description = (
        <ToolBarToolTitle toolName={"Rectangular annotation"} letter={"R"} />
      );
      break;
    case "Elliptical annotation":
      description = (
        <ToolBarToolTitle toolName={"Elliptical annotation"} letter={"E"} />
      );
      break;
    case "Freehand annotation":
      description = (
        <ToolBarToolTitle toolName={"Pen annotation"} letter={"D"} />
      );
      break;
    case "Lasso annotation (L)":
      description = (
        <ToolBarToolTitle toolName={"Lasso annotation"} letter={"L"} />
      );
      break;
    case "Polygonal annotation":
      description = (
        <ToolBarToolTitle toolName={"Polygonal annotation"} letter={"P"} />
      );
      break;
    case "Magnetic annotation":
      description = (
        <ToolBarToolTitle toolName={"Magnetic annotation"} letter={"M"} />
      );
      break;
    case "Color annotation":
      description = (
        <ToolBarToolTitle toolName={"Color annotation"} letter={"C"} />
      );
      break;
    case "Quick annotation":
      description = (
        <ToolBarToolTitle toolName={"Quick annotation"} letter={"Q"} />
      );
      break;
    case "Object annotation":
      description =
        "Select a rectangular annotation around a desired object to automatically generate its boundaries.";
      break;
    case "Hand":
      description = <ToolBarToolTitle toolName={"Hand tool"} letter={"H"} />;
      break;
    case "Zoom":
      description = <ToolBarToolTitle toolName={"Zoom tool"} letter={"Z"} />;
      break;
    case "Color Adjustment":
      description = (
        <ToolBarToolTitle toolName={"Intensity adjustment"} letter={"I"} />
      );
      break;
    default:
      description = "";
  }

  return (
    <Card sx={{ width: 210 }} raised variant="outlined">
      <CardActionArea>
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
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
