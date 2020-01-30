// import {Dialog, DialogContent} from "@material-ui/core";
// import * as React from "react";
// import {DialogAppBar} from "../DialogAppBar";
// import {DialogTransition} from "../DialogTransition";
// import classNames from "classnames";
// import Paper from "@material-ui/core/Paper";
// import Grid from "@material-ui/core/Grid";
// import {makeStyles} from "@material-ui/styles";
// import {Category, Image} from "@piximi/types";
// import * as tensorflow from "@tensorflow/tfjs";
// import {useState} from "react";
// import {styles} from "./EvaluateClassifierDialog.css";
// import {createTestSet, assignToSet} from "./dataset";
// import * as tfvis from "@tensorflow/tfjs-vis";
// import {
//   evaluateTensorflowModel,
//   evaluateTensorflowModelCV
// } from "./modelEvaluater";
//
// const useStyles = makeStyles(styles);
//
// type EvaluateClassifierDialogProps = {
//   categories: Category[];
//   closeDialog: () => void;
//   images: Image[];
//   openedDialog: boolean;
//   openedDrawer: boolean;
//   datasetInitialized: boolean;
//   setDatasetInitialized: (datasetInitialized: boolean) => void;
//   setImagesPartition: (partitions: number[]) => void;
// };
//
// function roundToFour(num: number) {
//   // @ts-ignore
//   return +(Math.round(num + "e+4") + "e-4");
// }
//
// export const EvaluateClassifierDialog = (
//   props: EvaluateClassifierDialogProps
// ) => {
//   const {
//     categories,
//     closeDialog,
//     images,
//     openedDialog,
//     openedDrawer,
//     datasetInitialized,
//     setDatasetInitialized,
//     setImagesPartition
//   } = props;
//
//   // assign each image to train- test- or validation- set
//   const initializeDatasets = () => {
//     if (datasetInitialized) {
//       return;
//     }
//     var partitions: number[] = [];
//     images.forEach((image: Image) => {
//       const setItentifier = assignToSet();
//       partitions.push(setItentifier);
//     });
//     setImagesPartition(partitions);
//     setDatasetInitialized(true);
//   };
//
//   const styles = useStyles({});
//   const [useCrossValidation, setUseCrossValidation] = useState<boolean>(false);
//   const [accuracy, setAccuracy] = useState<string>("not evaluated yet");
//
//   const onUseCrossValidationChange = (event: React.FormEvent<EventTarget>) => {
//     setUseCrossValidation(!useCrossValidation);
//   };
//
//   const className = classNames(styles.content, styles.contentLeft, {
//     [styles.contentShift]: openedDrawer,
//     [styles.contentShiftLeft]: openedDrawer
//   });
//
//   const classes = {
//     paper: styles.paper
//   };
//
//   const evaluate = async () => {
//     const numberOfClasses: number = categories.length - 1;
//     const model = await tensorflow.loadLayersModel("indexeddb://mobilenet");
//
//     var modelEvaluationResults;
//     if (useCrossValidation) {
//       var evaluationSet = await createTestSet(categories, images);
//       modelEvaluationResults = await evaluateTensorflowModelCV(
//         model,
//         evaluationSet.data,
//         evaluationSet.labels,
//         numberOfClasses
//       );
//     } else {
//       var evaluationSet = await createTestSet(categories, images);
//       modelEvaluationResults = evaluateTensorflowModel(
//         model,
//         evaluationSet.data,
//         evaluationSet.labels,
//         numberOfClasses
//       );
//     }
//
//     var accuracy = modelEvaluationResults.accuracy;
//     setAccuracy(roundToFour(accuracy).toString());
//     var confusionMatrixArray = modelEvaluationResults.confusionMatrixArray;
//
//     var values = [];
//     for (let i = 0; i < numberOfClasses; i++) {
//       const row = [];
//       for (let j = 0; j < numberOfClasses; j++) {
//         // @ts-ignore
//         row.push(confusionMatrixArray[i + j]);
//       }
//       values.push(row);
//     }
//     const lableCategories = categories.filter((category: Category) => {
//       return category.identifier !== "00000000-0000-0000-0000-000000000000";
//     });
//     const lables = lableCategories.map((category: Category) => {
//       return category.description;
//     });
//     const data = {values: values, tickLabels: lables};
//
//     tfvis.render.confusionMatrix(EvaluateClassifierDialog, data);
//   };
//
//   const onEvaluate = async () => {
//     initializeDatasets();
//     await evaluate().then(() => {});
//   };
//
//   return (
//     // @ts-ignore
//     <Dialog
//       className={className}
//       classes={classes}
//       disableBackdropClick
//       disableEscapeKeyDown
//       fullScreen
//       onClose={closeDialog}
//       open={openedDialog}
//       TransitionComponent={DialogTransition}
//       style={{zIndex: 1203}}
//     >
//       <DialogAppBar
//         closeDialog={closeDialog}
//         evaluate={onEvaluate}
//         openedDrawer={openedDrawer}
//         useCrossValidation={useCrossValidation}
//         onUseCrossValidationChange={onUseCrossValidationChange}
//       />
//       <div>
//         <Grid container spacing={3}>
//           <Grid id="evaluationID">
//             // @ts-ignore
//             <Paper
//               style={{
//                 margin: "24px",
//                 padding: "24px",
//                 fontSize: "larger"
//               }}
//             >
//               accuracy: {accuracy}
//             </Paper>
//           </Grid>
//         </Grid>
//       </div>
//       // @ts-ignore
//       <DialogContent style={{padding: "0px", margin: "12px"}}>
//         <div
//           id="tfjs-visor-container"
//           style={{
//             position: "absolute",
//             height: "100%",
//             width: "100%",
//             padding: "12px"
//           }}
//         />
//       </DialogContent>
//     </Dialog>
//   );
// };

import * as React from "react";

export const EvaluateClassifierDialog = () => {
  return <div />;
};
