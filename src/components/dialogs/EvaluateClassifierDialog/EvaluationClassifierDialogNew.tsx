import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { EvaluateMetricInfoBox } from "./EvaluateMetricInfoBox";
import { ConfusionMatrix } from "./ConfusionMatrixPlot";
import { useSelector } from "react-redux";
import { selectClassifierEvaluationResult } from "store/slices/classifier";
import { Category } from "types";
import { selectActiveKnownCategories } from "store/slices/newData/selectors/reselectors";

type EvaluateClassifierDialogNewProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const EvaluateClassifierDialogNew = ({
  closeDialog,
  openedDialog,
}: EvaluateClassifierDialogNewProps) => {
  const evaluationResults = useSelector(selectClassifierEvaluationResult);
  const categories = useSelector(selectActiveKnownCategories);

  return (
    <Dialog
      onClose={closeDialog}
      open={openedDialog}
      fullWidth
      maxWidth="md"
      sx={{ zIndex: 1203, height: "700px" }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Model Evaluation
        <IconButton
          aria-label="close"
          onClick={closeDialog}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid
          container
          direction="row"
          justifyContent="space-evenly"
          alignItems="flex-start"
        >
          <ConfusionMatrix
            classNames={categories.map((c: Category) => c.name)}
            confusionMatrix={evaluationResults.confusionMatrix}
          />

          <div>
            <Typography align={"center"} variant="body1" sx={{ mb: 2 }}>
              Evaluation metrics:
            </Typography>
            <Stack spacing={1} direction="row">
              <EvaluateMetricInfoBox
                metric={"Accuracy"}
                value={evaluationResults.accuracy}
                link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
              />
              <EvaluateMetricInfoBox
                metric={"Cross entropy"}
                value={evaluationResults.crossEntropy}
                link="https://en.wikipedia.org/wiki/Cross_entropy"
              />
            </Stack>
            <Stack spacing={1} direction="row">
              <EvaluateMetricInfoBox
                metric={"Precision"}
                value={evaluationResults.precision}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
              <EvaluateMetricInfoBox
                metric={"Recall"}
                value={evaluationResults.recall}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
            </Stack>
            <EvaluateMetricInfoBox
              metric={"F1-score"}
              value={evaluationResults.f1Score}
              link="https://en.wikipedia.org/wiki/F-score"
            />
          </div>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
