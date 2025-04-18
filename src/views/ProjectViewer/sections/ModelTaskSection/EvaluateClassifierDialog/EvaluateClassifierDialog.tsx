import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  Stack,
  Typography,
  Box,
  Pagination,
} from "@mui/material";

import { DialogTransitionSlide } from "components/dialogs";
import { EvaluationMetricsInfoBox } from "./EvaluationMetricsInfoBox";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { EvaluateClassifierDialogAppBar } from "./EvaluateClassifierAppBar";

import { selectActiveKnownCategories } from "store/project/reselectors";
import {
  selectClassifierEvaluationResult,
  selectClassifierModel,
} from "store/classifier/reselectors";

import { Category } from "store/data/types";
import { useState } from "react";

type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const EvaluateClassifierDialog = ({
  closeDialog,
  openedDialog,
}: EvaluateClassifierDialogProps) => {
  const evaluationResults = useSelector(selectClassifierEvaluationResult);
  const categories = useSelector(selectActiveKnownCategories);
  const selectedModel = useSelector(selectClassifierModel);
  const [trainingRun, setTrainingRun] = useState(0);

  const handleRunChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setTrainingRun(page - 1);
  };

  return evaluationResults.length === 0 ? null : (
    <Dialog
      onClose={closeDialog}
      open={openedDialog}
      fullWidth
      maxWidth="md"
      slots={{ transition: DialogTransitionSlide }}
      sx={{ zIndex: 1203, height: "100%" }}
    >
      <EvaluateClassifierDialogAppBar closeDialog={closeDialog} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          px: 2,
          py: 1,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2">{selectedModel?.name}</Typography>
        <Box display="flex" flexDirection="row" alignItems="center">
          <Typography variant="body2"> Training Run</Typography>
          <Pagination
            count={evaluationResults.length}
            page={trainingRun + 1}
            onChange={handleRunChange}
          />
        </Box>
      </Box>
      <DialogContent>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-evenly"
          alignItems="flex-start"
        >
          <ConfusionMatrix
            classNames={categories.map((c: Category) => c.name)}
            confusionMatrix={evaluationResults[trainingRun].confusionMatrix}
          />

          <div>
            <Typography align={"center"} variant="body1" sx={{ mb: 2 }}>
              Evaluation metrics:
            </Typography>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Accuracy"}
                value={evaluationResults[trainingRun].accuracy}
                link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
              />
              <EvaluationMetricsInfoBox
                metric={"Cross entropy"}
                value={evaluationResults[trainingRun].crossEntropy}
                link="https://en.wikipedia.org/wiki/Cross_entropy"
              />
            </Stack>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Precision"}
                value={evaluationResults[trainingRun].precision}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
              <EvaluationMetricsInfoBox
                metric={"Recall"}
                value={evaluationResults[trainingRun].recall}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
            </Stack>
            <EvaluationMetricsInfoBox
              metric={"F1-score"}
              value={evaluationResults[trainingRun].f1Score}
              link="https://en.wikipedia.org/wiki/F-score"
            />
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
