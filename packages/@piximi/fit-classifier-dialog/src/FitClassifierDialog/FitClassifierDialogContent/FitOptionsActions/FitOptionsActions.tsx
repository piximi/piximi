import IconButton from "@material-ui/core/IconButton";
import ArrowBack from "@material-ui/icons/ArrowBack";
import * as React from "react";

import {useStyles} from "./FitOptionsActions.css";
import {FitButton} from "../FitButton";

type FitOptionsActionsProps = {
  activeStep: any;
  next: any;
  previous: any;
};

export const FitOptionsActions = ({
  activeStep,
  next,
  previous
}: FitOptionsActionsProps) => {
  const classes = useStyles({});

  return (
    <div className={classes.actionsContainer}>
      <div>
        <IconButton
          className={classes.button}
          disabled={activeStep === 0}
          onClick={previous}
        >
          <ArrowBack />
        </IconButton>

        <FitButton next={next} />
      </div>
    </div>
  );
};
