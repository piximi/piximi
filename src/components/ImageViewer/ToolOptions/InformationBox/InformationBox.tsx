import Box from "@mui/material/Box";
import React from "react";
import { Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { useStyles } from "./InformationBox.css";

type InformationBoxProps = {
  description: string;
  name: string;
};

export const InformationBox = ({ description, name }: InformationBoxProps) => {
  const classes = useStyles();

  return (
    <AppBar className={classes.appBar} color="default">
      <Toolbar disableGutters={true}>
        <Typography variant="h6" color="inherit">
          &nbsp;
        </Typography>
        <Typography style={{ marginLeft: 12 }}>{name}</Typography>
      </Toolbar>
    </AppBar>
  );
};
