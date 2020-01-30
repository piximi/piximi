import DialogContent from "@material-ui/core/DialogContent";
import * as React from "react";

import {FitClassifierDialogContentStepper} from "../FitClassifierDialogContentStepper";
import {History} from "../History";

type FitClassifierDialogContentStepperProps = {};

export const FitClassifierDialogContent = ({}: FitClassifierDialogContentStepperProps) => {
  return (
    <DialogContent style={{paddingTop: "80px"}}>
      <History
        status={"Training"}
        lossData={[]}
        validationLossData={[]}
        accuracyData={[]}
        validationAccuracyData={[]}
      />

      <FitClassifierDialogContentStepper />
    </DialogContent>
  );
};
