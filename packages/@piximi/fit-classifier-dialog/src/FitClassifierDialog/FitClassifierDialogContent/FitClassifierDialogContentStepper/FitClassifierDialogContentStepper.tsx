import {Step} from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import StepContent from "@material-ui/core/StepContent";
import StepLabel from "@material-ui/core/StepLabel";
import Stepper from "@material-ui/core/Stepper";
import * as React from "react";

import {CompileOptionsActions} from "../CompileOptionsActions";
import {CompileOptionsForm} from "../CompileOptionsForm";
import {FitOptionsActions} from "../FitOptionsActions";
import {FitOptionsForm} from "../FitOptionsForm";
import {GeneratorOptionsActions} from "../GeneratorOptionsActions";
import {GeneratorOptionsForm} from "../GeneratorOptionsForm";
import {ModelOptionsForm} from "../ModelOptionsForm/ModelOptionsForm/ModelOptionsForm";
import {ModelOptionsActions} from "../ModelOptionsActions";

type FitClassifierDiaslogContentProps = {};

export const FitClassifierDialogContentStepper = ({}: FitClassifierDiaslogContentProps) => {
  const [activeStep, setActiveStep] = React.useState(0);

  const next = () => {
    setActiveStep((previous) => previous + 1);
  };

  const previous = () => {
    setActiveStep((previous) => previous - 1);
  };

  const reset = () => {
    setActiveStep(0);
  };

  return (
    <Grid item md={8}>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="model-options">
          <StepLabel>Model options</StepLabel>

          <StepContent>
            <ModelOptionsForm />

            <ModelOptionsActions
              activeStep={activeStep}
              next={next}
              previous={previous}
            />
          </StepContent>
        </Step>

        <Step key="compile-options">
          <StepLabel>Compile options</StepLabel>

          <StepContent>
            <CompileOptionsForm />

            <CompileOptionsActions
              activeStep={activeStep}
              next={next}
              previous={previous}
            />
          </StepContent>
        </Step>

        <Step key="preprocessing-options">
          <StepLabel>Generator options</StepLabel>

          <StepContent>
            <GeneratorOptionsForm />

            <GeneratorOptionsActions
              activeStep={activeStep}
              next={next}
              previous={previous}
            />
          </StepContent>
        </Step>

        <Step key="fit-options">
          <StepLabel>Fit options</StepLabel>

          <StepContent>
            <FitOptionsForm />

            <FitOptionsActions
              activeStep={activeStep}
              next={next}
              previous={previous}
            />
          </StepContent>
        </Step>
      </Stepper>
    </Grid>
  );
};
