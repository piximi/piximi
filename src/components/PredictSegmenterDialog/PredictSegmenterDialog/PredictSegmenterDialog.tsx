import { Dialog, DialogContent } from "@material-ui/core";
import * as React from "react";
import { PredictSegmenterDialogAppBar } from "../PredictSegmenterDialogAppBar";
import { DialogTransition } from "../DialogTransition";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import * as tensorflow from "@tensorflow/tfjs";
import { useState } from "react";
import { useStyles } from "./PredictSegmenterDialog.css";
import { createTestSet, assignToSet } from "./dataset";
import {
  evaluateTensorflowModel,
  evaluateTensorflowModelCV,
} from "./modelEvaluater";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";

type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

function roundToFour(num: number) {
  // @ts-ignore
  return +(Math.round(num + "e+4") + "e-4");
}

export const PredictSegmenterDialog = (
  props: EvaluateClassifierDialogProps
) => {
  const classes = useStyles({});

  const { closeDialog, openedDialog } = props;

  const styles = useStyles({});
  const [accuracy, setAccuracy] = useState<string>("not evaluated yet");

  const predict = async () => {
    //FIXME replace with segmenter forward pass code
    // const numberOfClasses: number = categories.length - 1;
    // const model = await tensorflow.loadLayersModel("indexeddb://mobilenet");
    //
    // var modelEvaluationResults;
    //
    // var evaluationSet = await createTestSet(categories, images);
    // modelEvaluationResults = evaluateTensorflowModel(
    //   model,
    //   evaluationSet.data,
    //   evaluationSet.labels,
    //   numberOfClasses
    // );
    //
    //
    // var accuracy = modelEvaluationResults.accuracy;
    // setAccuracy(roundToFour(accuracy).toString());
    // var confusionMatrixArray = modelEvaluationResults.confusionMatrixArray;
    //
    // var values = [];
    // for (let i = 0; i < numberOfClasses; i++) {
    //   const row = [];
    //   for (let j = 0; j < numberOfClasses; j++) {
    //     // @ts-ignore
    //     row.push(confusionMatrixArray[i + j]);
    //   }
    //   values.push(row);
    // }
    // const lableCategories = categories.filter((category: Category) => {
    //   return category.identifier !== "00000000-0000-0000-0000-000000000000";
    // });
    // const lables = lableCategories.map((category: Category) => {
    //   return category.description;
    // });
    // const data = {values: values, tickLabels: lables};
    //
    // tfvis.render.confusionMatrix(PredictSegmenterDialog, data);
  };

  const onPredict = async () => {
    await predict().then(() => {});
  };

  return (
    // @ts-ignore
    <Dialog
      disableBackdropClick
      disableEscapeKeyDown
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 1203 }}
    >
      <PredictSegmenterDialogAppBar
        closeDialog={closeDialog}
        evaluate={onPredict}
      />
      <div>
        <Grid container spacing={3}>
          <Grid id="evaluationID">
            <Paper
              style={{
                margin: "24px",
                padding: "24px",
                fontSize: "larger",
              }}
            >
              accuracy: {accuracy}
            </Paper>
          </Grid>
        </Grid>
      </div>

      <DialogContent style={{ padding: "0px", margin: "12px" }}>
        <div
          id="tfjs-visor-container"
          style={{
            position: "absolute",
            height: "100%",
            width: "100%",
            padding: "12px",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
