import { useState } from "react";
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
  const [evalResult, setEvalResult] = useState(0);

  const handleEvalResultChange = (
    _event: React.ChangeEvent<unknown>,
    page: number,
  ) => {
    setEvalResult(page - 1);
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
          <Typography variant="body2">Evaluation Result</Typography>
          <Pagination
            count={evaluationResults.length}
            page={evalResult + 1}
            onChange={handleEvalResultChange}
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
            confusionMatrix={evaluationResults[evalResult].confusionMatrix}
          />

          <div>
            <Typography align={"center"} variant="body1" sx={{ mb: 2 }}>
              Evaluation metrics:
            </Typography>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Accuracy"}
                value={evaluationResults[evalResult].accuracy}
                link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
              />
              <EvaluationMetricsInfoBox
                metric={"Cross entropy"}
                value={evaluationResults[evalResult].crossEntropy}
                link="https://en.wikipedia.org/wiki/Cross_entropy"
              />
            </Stack>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Precision"}
                value={evaluationResults[evalResult].precision}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
              <EvaluationMetricsInfoBox
                metric={"Recall"}
                value={evaluationResults[evalResult].recall}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
            </Stack>
            <EvaluationMetricsInfoBox
              metric={"F1-score"}
              value={evaluationResults[evalResult].f1Score}
              link="https://en.wikipedia.org/wiki/F-score"
            />
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
