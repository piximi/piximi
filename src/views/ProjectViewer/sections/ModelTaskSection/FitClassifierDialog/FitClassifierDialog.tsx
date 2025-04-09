import { Box, Dialog, DialogContent, Tabs } from "@mui/material";

import { ModelSummaryTable } from "views/ProjectViewer/sections/ModelTaskSection/data-display";
import { DialogTransitionSlide } from "components/dialogs";

import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";

import { ToolTipTab } from "components/layout";
import { useEffect, useMemo, useState } from "react";
import { TrainingSettings } from "../training-settings/TrainingSettings";
import TrainingPlots from "./TrainingPlots";
import { useClassifierHistory } from "views/ProjectViewer/contexts/ClassifierHistoryProvider";

import { useSelector } from "react-redux";
import { selectClassifierModel } from "store/classifier/reselectors";

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
  const selectedModel = useSelector(selectClassifierModel);

  const showPlots = useMemo(() => {
    return modelHistory.categoricalAccuracy.length > 0;
  }, [modelHistory]);
  const onTabSelect = (_event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useEffect(() => {
    if (showPlots) {
      setTabVal("2");
    }
  }, [showPlots]);

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
          disabled={!selectedModel?.modelSummary}
        />
      </Tabs>

      <DialogContent>
        <Box hidden={tabVal !== "1"}>
          <TrainingSettings />
        </Box>
        <Box hidden={tabVal !== "2"}>
          <TrainingPlots />
        </Box>
        <Box hidden={tabVal !== "3"}>
          {/* TODO: implement model summary for graph models */}
          {selectedModel?.modelSummary && (
            <ModelSummaryTable modelSummary={selectedModel.modelSummary} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
