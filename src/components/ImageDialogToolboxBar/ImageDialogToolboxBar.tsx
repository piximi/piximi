import { AppBar, Button, Toolbar } from "@mui/material";
import Typography from "@mui/material/Typography";
import BrushIcon from "@mui/icons-material/Brush";
import Crop32Icon from "@mui/icons-material/Crop32";
import React from "react";
import { useStyles } from "./ImageDialogToolboxBar.css";
import IconButton from "@mui/material/IconButton";
import PanToolIcon from "@mui/icons-material/PanTool";

export const ImageDialogToolboxBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.imageDialogToolboxBar}>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          <Typography color="inherit" style={{ paddingRight: 20 }} />
          <IconButton color="inherit" onClick={() => {}}>
            <BrushIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => {}}>
            <Crop32Icon />
          </IconButton>
          <div className={classes.grow} />
          <IconButton color="inherit" onClick={() => {}}>
            <PanToolIcon />
          </IconButton>
          <Button />
        </Toolbar>
      </AppBar>
    </div>
  );
};
