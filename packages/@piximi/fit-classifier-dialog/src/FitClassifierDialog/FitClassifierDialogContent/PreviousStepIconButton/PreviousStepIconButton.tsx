import * as React from "react";
import {useStyles} from "./PreviousStepIconButton.css";
import IconButton from "@material-ui/core/IconButton";
import ArrowBack from "@material-ui/icons/ArrowBack";

export const PreviousStepIconButton = ({
  activeStep,
  previous
}: {
  activeStep: any;
  previous: any;
}) => {
  const classes = useStyles({});

  return (
    <IconButton
      className={classes.button}
      disabled={activeStep === 0}
      onClick={previous}
    >
      <ArrowBack />
    </IconButton>
  );
};
