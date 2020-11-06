import Typography from "@material-ui/core/Typography";
import React from "react";
import { useStyles } from "./Logo.css";

export const Logo = () => {
  const classes = useStyles();

  return (
    <Typography className={classes.title} color="inherit" noWrap variant="h6">
      Piximi
    </Typography>
  );
};
