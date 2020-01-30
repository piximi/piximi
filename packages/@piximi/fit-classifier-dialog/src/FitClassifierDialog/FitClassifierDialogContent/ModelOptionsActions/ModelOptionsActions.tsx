import * as React from "react";

import {PreviousStepIconButton} from "../PreviousStepIconButton";
import {useStyles} from "./ModelOptionsActions.css";
import {OpenButton} from "../OpenButton";

type ModelOptionsActionsProps = {
  activeStep: any;
  next: any;
  previous: any;
};

export const ModelOptionsActions = ({
  activeStep,
  next,
  previous
}: ModelOptionsActionsProps) => {
  const classes = useStyles({});

  return (
    <div className={classes.actionsContainer}>
      <div>
        <PreviousStepIconButton activeStep={activeStep} previous={previous} />

        <OpenButton next={next} />
      </div>
    </div>
  );
};
