import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  alpha,
  Box,
  Button,
  Collapse,
  Container,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { useDialog, useDialogHotkey } from "hooks";
import { SaveFittedModelDialog } from "components/dialogs";
import { ModelExecButtonGroup } from "./ModelExecButtonGroup";
import { ModelIOButtonGroup } from "./ModelIOButtonGroup";
import { ImportTensorflowClassificationModelDialog } from "./ImportTensorflowModelDialog";
import { FitClassifierDialog } from "./FitClassifierDialog";
import { EvaluateClassifierDialog } from "./EvaluateClassifierDialog";

import { HotkeyContext } from "utils/common/enums";
import { ModelStatus, ModelTask } from "utils/models/enums";
import {
  selectClassifierEvaluationResult,
  selectClassifierModel,
} from "store/classifier/reselectors";
import { Model } from "utils/models/Model";
import { Shape, Thing } from "store/data/types";
import { SequentialClassifier } from "utils/models/classification";
import { PredictionListItems } from "views/ProjectViewer/components/list-items";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { usePredictClassifier } from "views/ProjectViewer/hooks/usePredictClassifier";
import { selectCategoriesDictionary } from "store/data/selectors";
import { useEvaluateClassifier } from "views/ProjectViewer/hooks/useEvaluateClassifier";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import classifierHandler from "utils/models/classification/classifierHandler";
import { classifierSlice } from "store/classifier";
import { selectActiveKindId } from "store/project/selectors";
import { StyledSelect } from "views/ProjectViewer/components/StyledSelect";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

export const ClassifierSection = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectClassifierModel);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const { modelStatus } = useClassifierStatus();
  const predictClassifier = usePredictClassifier();
  const evaluateClassifier = useEvaluateClassifier();
  const evaluationResults = useSelector(selectClassifierEvaluationResult);
  const activeKindId = useSelector(selectActiveKindId);
  const [selectedModelName, setSelectedModelName] = useState<string>("new");
  const handleImportModel = async (model: Model, _inputShape: Shape) => {
    if (model instanceof SequentialClassifier) {
      classifierHandler.addModel(model);
    } else if (import.meta.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask.Classification}`,
      );
    }
  };
  const {
    onClose: handleCloseEvaluateClassifierDialog,
    onOpen: handleOpenEvaluateClassifierDialog,
    open: evaluateClassifierDialogOpen,
  } = useDialog();
  // const {
  //   onClose: handleCloseHTLDialog,
  //   onOpen: handleOpenHTLDialog,
  //   open: htlDialogOpen,
  // } = useDialog();

  const {
    onClose: handleCloseImportClassifierDialog,
    onOpen: handleOpenImportClassifierDialog,
    open: ImportClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseSaveClassifierDialog,
    onOpen: handleOpenSaveClassifierDialog,
    open: SaveClassifierDialogOpen,
  } = useDialog();
  const {
    onClose: handleCloseFitClassifierDialog,
    onOpen: handleOpenFitClassifierDialog,
    open: fitClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ClassifierDialog, false);

  const handlePredict = async () => {
    await predictClassifier();
    //handleOpenHTLDialog();
  };
  const handleDisposeModel = () => {
    if (!selectedModel) return;
    classifierHandler.removeModel(selectedModel.name);
    dispatch(
      classifierSlice.actions.removeModelInfo({
        modelName: selectedModel.name,
      }),
    );
    setSelectedModelName("new");
  };
  const handleEvaluate = async () => {
    if (!selectedModel) return;
    if (selectedModel?.history.history.length > evaluationResults.length)
      await evaluateClassifier();

    handleOpenEvaluateClassifierDialog();
  };
  const handleModelChange = (event: SelectChangeEvent<unknown>) => {
    let value: string | number = event.target.value as string;
    setSelectedModelName(value);
    if (value === "new") value = 0;

    dispatch(
      classifierSlice.actions.updateSelectedModelNameOrArch({
        kindId: activeKindId,
        modelName: value,
      }),
    );
  };
  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
      handleOpenEvaluateClassifierDialog();
    }
  }, [
    modelStatus,
    waitingForResults,
    handleOpenEvaluateClassifierDialog,
    setWaitingForResults,
  ]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        px={1}
        gap={1}
      >
        <ModelIOButtonGroup
          hasTrainedModel={!!selectedModel}
          handleImportModel={handleOpenImportClassifierDialog}
          handleSaveModel={handleOpenSaveClassifierDialog}
        />

        <Stack
          width="100%"
          sx={(theme) => ({
            width: "100%",
            py: 1,
            px: 0.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <WithLabel
            label="Model:"
            labelProps={{
              variant: "body2",
              sx: { mr: "1rem", whiteSpace: "nowrap" },
            }}
            fullWidth={true}
          >
            <StyledSelect
              value={selectedModelName}
              onChange={handleModelChange}
              fullWidth
            >
              <MenuItem
                dense
                value="new"
                sx={{
                  borderRadius: 0,
                  minHeight: "1rem",
                }}
              >
                New Model
              </MenuItem>
              {classifierHandler.getModelNames().map((modelName, idx) => (
                <MenuItem
                  key={modelName + idx}
                  dense
                  value={modelName}
                  sx={{
                    borderRadius: 0,
                    minHeight: "1rem",
                  }}
                >
                  {modelName}
                </MenuItem>
              ))}
            </StyledSelect>
          </WithLabel>
          <Collapse in={!!selectedModel}>
            <Stack direction="row-reverse" width="100%">
              <TooltipWithDisable
                title={"Delete the current model"}
                placement="bottom"
              >
                <Button
                  onClick={handleDisposeModel}
                  disableFocusRipple
                  color="primary"
                  variant="text"
                  sx={(theme) => ({
                    fontSize: theme.typography.caption.fontSize,
                    backgroundColor: "transparent",
                  })}
                >
                  Delete Model
                </Button>
              </TooltipWithDisable>
            </Stack>
          </Collapse>
        </Stack>

        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleFit={handleOpenFitClassifierDialog}
          handlePredict={handlePredict}
          handleEvaluate={handleEvaluate}
          modelTrainable={!selectedModel || selectedModel.trainable}
        />
      </Box>
      {modelStatus === ModelStatus.Pending && <PredictionListItems />}
      <ImportTensorflowClassificationModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
        dispatchFunction={handleImportModel}
      />
      {selectedModel && (
        <SaveFittedModelDialog
          model={selectedModel}
          modelStatus={modelStatus}
          onClose={handleCloseSaveClassifierDialog}
          open={SaveClassifierDialogOpen}
        />
      )}
      <FitClassifierDialog
        openedDialog={fitClassifierDialogOpen}
        closeDialog={handleCloseFitClassifierDialog}
      />
      {/* <HTLDialog
        openedDialog={htlDialogOpen}
        closeDialog={handleCloseHTLDialog}
      /> */}

      <EvaluateClassifierDialog
        openedDialog={evaluateClassifierDialogOpen}
        closeDialog={handleCloseEvaluateClassifierDialog}
      />
    </>
  );
};

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs
export const ImageGrid = ({
  things,
}: {
  things: Array<Thing & { probability: number }>;
}) => {
  const categories = useSelector(selectCategoriesDictionary);

  return (
    <Container maxWidth={false}>
      <ImageList sx={{ width: "100%", height: "100%" }} cols={3} gap={24}>
        {things.map((thing) => (
          <ImageListItem key={thing.id} sx={{ width: "100%", height: "100%" }}>
            <img src={thing.src} />
            <ImageListItemBar
              title={`Category: ${categories[thing.categoryId].name}`}
              subtitle={`Confidence: ${(thing.probability * 100).toFixed(2)}`}
              sx={{
                backgroundColor: alpha(categories[thing.categoryId].color, 0.7),
                color: (theme) =>
                  theme.palette.getContrastText(
                    categories[thing.categoryId].color,
                  ),
              }}
              position="bottom"
            />
          </ImageListItem>
        ))}
      </ImageList>
    </Container>
  );
};

// type EvaluateClassifierDialogProps = {
//   closeDialog: () => void;
//   openedDialog: boolean;
// };

// const HTLDialog = ({
//   closeDialog,
//   openedDialog,
// }: EvaluateClassifierDialogProps) => {
//   const things = useSelector(selectActiveThings);
//   const { predictedProbabilities } = useClassifierHistory();

//   const predictedThings = useMemo(() => {
//     const predicted = things
//       .filter((thing) => Object.keys(predictedProbabilities).includes(thing.id))
//       .map((thing) => ({
//         ...thing,
//         probability: predictedProbabilities[thing.id],
//       }));
//     return orderBy(predicted, ["probability"], ["asc"]);
//   }, [predictedProbabilities, things]);
//   return (
//     <Dialog
//       onClose={closeDialog}
//       open={openedDialog}
//       fullWidth
//       maxWidth="md"
//       slots={{ transition: DialogTransitionSlide }}
//       sx={{ zIndex: 1203, height: "100%" }}
//     >
//       <AppBar
//         sx={{
//           position: "sticky",
//           backgroundColor: "transparent",
//           boxShadow: "none",
//           borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
//         }}
//       >
//         <Toolbar
//           sx={{
//             display: "flex",
//             justifyContent: "center",
//           }}
//         >
//           <IconButton
//             edge="start"
//             color="primary"
//             onClick={closeDialog}
//             aria-label="Close"
//             sx={{
//               position: "absolute",
//               right: 8,
//               my: "auto",
//             }}
//           >
//             <Close />
//           </IconButton>

//           <Typography variant="h4">Predictions</Typography>
//         </Toolbar>
//       </AppBar>

//       <DialogContent>
//         <ImageGrid things={predictedThings} />
//       </DialogContent>
//     </Dialog>
//   );
// };
