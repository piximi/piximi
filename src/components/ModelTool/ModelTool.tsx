import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import React, { ReactElement, useState } from "react";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { Card, CardActionArea, CardContent, Tooltip } from "@mui/material";
import { useStyles } from "./ModelTool.css";
import { ModelToolBarToolTitle } from "./ModelToolBarToolTitle";

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
  const classes = useStyles();

  let description: string | ReactElement;

  switch (name) {
    case "Pointer":
      description = (
        <ModelToolBarToolTitle toolName={"Select annotations"} letter={"S"} />
      );
      break;
    case "Rectangular annotation":
      description = (
        <ModelToolBarToolTitle
          toolName={"Rectangular annotation"}
          letter={"R"}
        />
      );
      break;
    case "Elliptical annotation":
      description = (
        <ModelToolBarToolTitle
          toolName={"Elliptical annotation"}
          letter={"E"}
        />
      );
      break;
    case "Freehand annotation":
      description = (
        <ModelToolBarToolTitle toolName={"Pen annotation"} letter={"D"} />
      );
      break;
    case "Lasso annotation (L)":
      description = (
        <ModelToolBarToolTitle toolName={"Lasso annotation"} letter={"L"} />
      );
      break;
    case "Polygonal annotation":
      description = (
        <ModelToolBarToolTitle toolName={"Polygonal annotation"} letter={"P"} />
      );
      break;
    case "Magnetic annotation":
      description = (
        <ModelToolBarToolTitle toolName={"Magnetic annotation"} letter={"M"} />
      );
      break;
    case "Color annotation":
      description = (
        <ModelToolBarToolTitle toolName={"Color annotation"} letter={"C"} />
      );
      break;
    case "Quick annotation":
      description = (
        <ModelToolBarToolTitle toolName={"Quick annotation"} letter={"Q"} />
      );
      break;
    case "Object annotation":
      description =
        "Select a rectangular annotation around a desired object to automatically generate its boundaries.";
      break;
    case "Hand":
      description = (
        <ModelToolBarToolTitle toolName={"Hand tool"} letter={"H"} />
      );
      break;
    case "Zoom":
      description = (
        <ModelToolBarToolTitle toolName={"Zoom tool"} letter={"Z"} />
      );
      break;
    case "Color Adjustment":
      description = (
        <ModelToolBarToolTitle toolName={"Intensity adjustment"} letter={"I"} />
      );
      break;
    default:
      description = "";
  }

  return (
    <Card className={classes.card} raised variant="outlined">
      <CardActionArea>
        <div>
          {/*<CardHeader*/}
          {/*  action={*/}
          {/*    <IconButton onClick={onClose}>*/}
          {/*      <CancelIcon />*/}
          {/*    </IconButton>*/}
          {/*  }*/}
          {/*  className={classes.cardHeader}*/}
          {/*/>*/}

          {/*<CardMedia className={classes.cardMedia} image={image} />*/}
        </div>

        <CardContent>
          {/*<Typography gutterBottom variant="h6" component="h2">*/}
          {/*  {name}*/}
          {/*</Typography>*/}

          <Typography variant="body2" color="textSecondary" component="p">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/*<CardActions>*/}
      {/*  <Button size="small" color="primary">*/}
      {/*    Learn More*/}
      {/*  </Button>*/}
      {/*</CardActions>*/}
    </Card>
  );
};

export const ModelTool = ({ children, name, onClick, selected }: ToolProps) => {
  const classes = useStyles();

  const [open, setOpen] = useState<boolean>(false);

  const onClose = () => {
    setOpen(false);
  };

  const onOpen = () => {
    setOpen(true);
  };

  return (
    <Tooltip
      classes={{ tooltip: classes.tooltip }}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      placement="left"
      title={"preprocessing"}
    >
      <ListItem button onClick={onClick} selected={selected}>
        <ListItemIcon>
          <SvgIcon fontSize="small">{children}</SvgIcon>
        </ListItemIcon>
      </ListItem>
    </Tooltip>
  );
};
