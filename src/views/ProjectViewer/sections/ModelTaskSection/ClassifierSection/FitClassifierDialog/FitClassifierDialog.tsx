import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Dialog, DialogActions, DialogContent, Tabs } from "@mui/material";

import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { useParameterizedSelector } from "store/hooks";
import { selectModelLifecycleStatus } from "store/classifier/selectors";
import { applicationSettingsSlice } from "store/applicationSettings";

import { HotkeyContext } from "utils/enums";

import { useClassificationModel } from "@ProjectViewer/hooks";
import { ToolTipTab } from "@ProjectViewer/components";
import { DialogTransitionSlide } from "@ProjectViewer/components/dialogs";
import { useClassifierHistory } from "@ProjectViewer/contexts/ClassifierHistoryProvider";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import {
  TrainingPlots,
  ModelSummaryTable,
  ModelSettings,
  RunSummaryTable,
} from "./panels";
import { FitClassifierDialogActions } from "./FitClassifierDialogActions";

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
  const [prevStatus, setPrevStatus] = useState(modelStatus);
  if (modelStatus !== prevStatus) {
    setPrevStatus(modelStatus);
    if (modelStatus === "training") setTabVal("2");
  }

  const modelConfig = useClassificationModel();

  const showPlots = useMemo(() => {
    return modelHistory.categoricalAccuracy.length > 0;
  }, [modelHistory]);

  const tabUnavailable =
    ((tabVal === "2" || tabVal === "4") && !showPlots) ||
    (tabVal === "3" && !modelConfig?.modelSummary);
  const visibleTab =
    modelStatus !== "training" && tabUnavailable ? "1" : tabVal;
  const onTabSelect = (_event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

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
  }, [openedDialog, dispatch]);

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
      <DialogTitleBar title="Fit Model" closeDialog={closeDialog} />

      <Tabs value={visibleTab} variant="fullWidth" onChange={onTabSelect}>
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
        <Box hidden={visibleTab !== "1"}>
          <ModelSettings />
        </Box>
        <Box hidden={visibleTab !== "2"}>
          <TrainingPlots />
        </Box>
        <Box hidden={visibleTab !== "3"}>
          {/* TODO: implement model summary for graph models */}
          {modelConfig?.modelSummary && (
            <ModelSummaryTable modelSummary={modelConfig.modelSummary} />
          )}
        </Box>
        <Box hidden={visibleTab !== "4"}>
          {/* TODO: implement model summary for graph models */}
          {modelConfig?.modelSummary && <RunSummaryTable />}
        </Box>
      </DialogContent>
      <DialogActions>
        <FitClassifierDialogActions />
      </DialogActions>
    </Dialog>
  );
};
