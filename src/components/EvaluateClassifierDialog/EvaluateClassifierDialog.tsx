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

type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
  confusionMatrix: number[][];
  classNames: string[];
  accuracy: number;
  crossEntropy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

export const EvaluateClassifierDialog = (
  props: EvaluateClassifierDialogProps
) => {
  const {
    closeDialog,
    openedDialog,
    confusionMatrix,
    classNames,
    accuracy,
    crossEntropy,
    precision,
    recall,
    f1Score,
  } = props;

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
            classNames={classNames}
            confusionMatrix={confusionMatrix}
          />

          <div>
            <Typography align={"center"} variant="body1" sx={{ mb: 2 }}>
              Evaluation metrics:
            </Typography>
            <Stack spacing={1} direction="row">
              <EvaluateMetricInfoBox
                metric={"Accuracy"}
                value={accuracy}
                link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
              />
              <EvaluateMetricInfoBox
                metric={"Cross entropy"}
                value={crossEntropy}
                link="https://en.wikipedia.org/wiki/Cross_entropy"
              />
            </Stack>
            <Stack spacing={1} direction="row">
              <EvaluateMetricInfoBox
                metric={"Precision"}
                value={precision}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
              <EvaluateMetricInfoBox
                metric={"Recall"}
                value={recall}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
            </Stack>
            <EvaluateMetricInfoBox
              metric={"F1-score"}
              value={f1Score}
              link="https://en.wikipedia.org/wiki/F-score"
            />
          </div>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
