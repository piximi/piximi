import { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { Box, Dialog, DialogContent, Tabs } from "@mui/material";

import { ToolTipTab } from "components/layout";
import { DialogTransitionSlide } from "components/dialogs";

import { useClassifierHistory } from "@ProjectViewer/contexts/ClassifierHistoryProvider";
import { ModelSummaryTable } from "@ProjectViewer/sections/ModelTaskSection/data-display";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectActiveModel,
  selectModelLifecycleStatus,
} from "store/classifier/selectors";

import TrainingPlots from "./TrainingPlots";
import { TrainingSettings } from "../training-settings/TrainingSettings";
import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
  const [tabVal, setTabVal] = useState("1");
  const { modelHistory } = useClassifierHistory();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const model = useParameterizedSelector(selectActiveModel, modelTarget);

  const showPlots = useMemo(() => {
    return modelHistory.categoricalAccuracy.length > 0;
  }, [modelHistory]);
  const onTabSelect = (_event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useEffect(() => {
    if (modelStatus === "training") {
      setTabVal("2");
    }
  }, [modelStatus]);

  // Reset to the HyperParameters tab when the currently selected tab becomes
  // invalid (e.g. user switched to a new untrained model while the dialog was
  // closed). Tab 2 needs training history; tab 3 needs a compiled model.
  // Skip during training — plots are about to populate, and the other effect
  // above intentionally set tabVal to "2" for live epoch updates.
  useEffect(() => {
    if (modelStatus === "training") return;
    if (tabVal === "2" && !showPlots) setTabVal("1");
    if (tabVal === "3" && !model?.modelSummary) setTabVal("1");
  }, [tabVal, showPlots, model?.modelSummary, modelStatus]);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={closeDialog}
      open={openedDialog}
      slots={{ transition: DialogTransitionSlide }}
      sx={{
        zIndex: 1203,
        //height: "80%",
        pb: 1,
      }}
    >
      <FitClassifierDialogAppBar closeDialog={closeDialog} />

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="HyperParameters" value="1" placement="top" />

        <ToolTipTab
          label="Training Plots"
          value="2"
          disabledMessage="No Trained Model"
          placement="top"
          disabled={!showPlots}
        />

        <ToolTipTab
          label="Model Summary"
          value="3"
          disabledMessage="No Trained Model"
          placement="top"
          disabled={!model?.modelSummary}
        />
      </Tabs>

      <DialogContent>
        <Box hidden={tabVal !== "1"}>
          <TrainingSettings />
        </Box>
        <Box hidden={tabVal !== "2"}>
          <TrainingPlots />{" "}
        </Box>
        <Box hidden={tabVal !== "3"}>
          {/* TODO: implement model summary for graph models */}
          {model?.modelSummary && (
            <ModelSummaryTable modelSummary={model.modelSummary} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
