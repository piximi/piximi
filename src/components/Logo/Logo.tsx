import React from "react";
import { useStyles } from "./Logo.css";
import { Typography } from "@mui/material";

export const Logo = () => {
  const classes = useStyles();

  return (
    <Typography className={classes.title} color="inherit" noWrap variant="h6">
      Piximi
    </Typography>
  );
};
