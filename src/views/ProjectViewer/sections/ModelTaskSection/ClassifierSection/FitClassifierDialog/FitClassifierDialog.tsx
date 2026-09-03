import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Dialog, DialogContent, Tabs } from "@mui/material";

import { useClassificationModel } from "@ProjectViewer/hooks";
import { ToolTipTab } from "@ProjectViewer/components";
import { DialogTransitionSlide } from "@ProjectViewer/components/dialogs";
import { useClassifierHistory } from "@ProjectViewer/contexts/ClassifierHistoryProvider";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectModelLifecycleStatus } from "store/classifier/selectors";
import { applicationSettingsSlice } from "store/applicationSettings";

import { HotkeyContext } from "utils/enums";

import {
  TrainingPlots,
  ModelSummaryTable,
  ModelSettings,
  RunSummaryTable,
} from "./panels";
import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
  const dispatch = useDispatch();
  const [tabVal, setTabVal] = useState("1");
  const { modelHistory } = useClassifierHistory();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const modelConfig = useClassificationModel();

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
    if ((tabVal === "2" || tabVal === "4") && !showPlots) setTabVal("1");
    if (tabVal === "3" && !modelConfig?.modelSummary) setTabVal("1");
  }, [tabVal, showPlots, modelConfig?.modelSummary, modelStatus]);

  useEffect(() => {
    if (openedDialog) {
      dispatch(
        applicationSettingsSlice.actions.registerHotkeyContext({
          context: HotkeyContext.ClassifierDialog,
        }),
      );
    } else {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.ClassifierDialog,
        }),
      );
    }
  }, [openedDialog]);

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
          disabled={!modelConfig?.modelSummary}
        />
        <ToolTipTab
          label="Model Runs Summary"
          value="4"
          disabledMessage="No Trained Model"
          placement="top"
          disabled={!showPlots}
        />
      </Tabs>

      <DialogContent sx={{ pb: 0 }}>
        <Box hidden={tabVal !== "1"}>
          <ModelSettings />
        </Box>
        <Box hidden={tabVal !== "2"}>
          <TrainingPlots />
        </Box>
        <Box hidden={tabVal !== "3"}>
          {/* TODO: implement model summary for graph models */}
          {modelConfig?.modelSummary && (
            <ModelSummaryTable modelSummary={modelConfig.modelSummary} />
          )}
        </Box>
        <Box hidden={tabVal !== "4"}>
          {/* TODO: implement model summary for graph models */}
          {modelConfig?.modelSummary && <RunSummaryTable />}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
