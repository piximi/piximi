import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  alpha,
  AppBar,
  Box,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useDialog, useDialogHotkey } from "hooks";
import { Close } from "@mui/icons-material";
import {
  DialogTransitionSlide,
  SaveFittedModelDialog,
} from "components/dialogs";
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
import { selectActiveKindId } from "store/project/selectors";
import { Model } from "utils/models/Model";
import { Shape, Thing } from "store/data/types";
import { SequentialClassifier } from "utils/models/classification";
import { classifierSlice } from "store/classifier";
import { PredictionListItems } from "views/ProjectViewer/components/list-items";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { selectActiveThings } from "store/project/reselectors";
import { APPLICATION_COLORS } from "utils/common/constants";
import { useClassifierHistory } from "views/ProjectViewer/contexts/ClassifierHistoryProvider";
import { orderBy } from "lodash";
import { usePredictClassifier } from "views/ProjectViewer/hooks/usePredictClassifier";
import { selectCategoriesDictionary } from "store/data/selectors";
import { useEvaluateClassifier } from "views/ProjectViewer/hooks/useEvaluateClassifier";

export const ClassifierSection = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectClassifierModel);
  const activeKindId = useSelector(selectActiveKindId);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const [helperText, setHelperText] = useState<string>("No trained model");
  const { modelStatus } = useClassifierStatus();
  const predictClassifier = usePredictClassifier();
  const evaluateClassifier = useEvaluateClassifier();
  const evaluationResults = useSelector(selectClassifierEvaluationResult);
  const handleImportModel = async (model: Model, inputShape: Shape) => {
    if (model instanceof SequentialClassifier) {
      dispatch(
        classifierSlice.actions.loadUserSelectedModel({
          inputShape: inputShape,
          kindId: activeKindId,
          model,
        }),
      );
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
  const {
    onClose: handleCloseHTLDialog,
    //onOpen: handleOpenHTLDialog,
    open: htlDialogOpen,
  } = useDialog();

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
  };

  const handleEvaluate = async () => {
    if (!selectedModel) return;
    if (selectedModel?.history.history.length > evaluationResults.length)
      await evaluateClassifier();

    handleOpenEvaluateClassifierDialog();
  };

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
      //handleOpenEvaluateClassifierDialog();
    }
  }, [
    modelStatus,
    waitingForResults,
    handleOpenEvaluateClassifierDialog,
    setWaitingForResults,
  ]);
  useEffect(() => {
    if (modelStatus === ModelStatus.Trained) {
      return;
    }

    switch (modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Loading:
      case ModelStatus.Training:
        setHelperText("Disabled during training");
        break;
      case ModelStatus.Evaluating:
        // setHelperText("Evaluating...");
        break;
      case ModelStatus.Predicting:
        setHelperText("Predcting...");
        break;
      case ModelStatus.Suggesting:
        setHelperText("Accept/Reject suggested predictions first");
        break;
      default:
      //setHelperText("No Trained Model");
    }
  }, [modelStatus]);

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
        {selectedModel && (
          <Stack
            width="100%"
            py={0.5}
            borderTop={"1px solid white"}
            borderBottom={"1px solid white"}
            sx={(theme) => ({
              borderTop: `1px solid ${theme.palette.divider}`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Typography variant="caption" noWrap>
              {`Selected Model:  ${selectedModel ? selectedModel.name : "N/A"}`}
            </Typography>
          </Stack>
        )}
        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleFit={handleOpenFitClassifierDialog}
          handlePredict={handlePredict}
          handleEvaluate={handleEvaluate}
          modelTrainable={!selectedModel || selectedModel.trainable}
          helperText={helperText}
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
      <HTLDialog
        openedDialog={htlDialogOpen}
        closeDialog={handleCloseHTLDialog}
      />

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

type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

const HTLDialog = ({
  closeDialog,
  openedDialog,
}: EvaluateClassifierDialogProps) => {
  const things = useSelector(selectActiveThings);
  const { predictedProbabilities } = useClassifierHistory();

  const predictedThings = useMemo(() => {
    const predicted = things
      .filter((thing) => Object.keys(predictedProbabilities).includes(thing.id))
      .map((thing) => ({
        ...thing,
        probability: predictedProbabilities[thing.id],
      }));
    return orderBy(predicted, ["probability"], ["asc"]);
  }, [predictedProbabilities, things]);
  return (
    <Dialog
      onClose={closeDialog}
      open={openedDialog}
      fullWidth
      maxWidth="md"
      slots={{ transition: DialogTransitionSlide }}
      sx={{ zIndex: 1203, height: "100%" }}
    >
      <AppBar
        sx={{
          position: "sticky",
          backgroundColor: "transparent",
          boxShadow: "none",
          borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IconButton
            edge="start"
            color="primary"
            onClick={closeDialog}
            aria-label="Close"
            sx={{
              position: "absolute",
              right: 8,
              my: "auto",
            }}
          >
            <Close />
          </IconButton>

          <Typography variant="h4">Predictions</Typography>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <ImageGrid things={predictedThings} />
      </DialogContent>
    </Dialog>
  );
};
