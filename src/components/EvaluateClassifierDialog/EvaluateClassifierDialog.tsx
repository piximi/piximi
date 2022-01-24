import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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
  } = props;

  return (
    <Dialog
      disableEscapeKeyDown
      onClose={closeDialog}
      open={openedDialog}
      fullWidth
      maxWidth="md"
      sx={{ zIndex: 1203, height: "600px" }}
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
        <ConfusionMatrix
          classNames={classNames}
          confusionMatrix={confusionMatrix}
        />

        <Grid container spacing={2}>
          <Grid item xs={3}>
            <EvaluateMetricInfoBox
              metric={"Accuracy"}
              value={accuracy}
              link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
            />
          </Grid>
          <Grid item xs={3}>
            <EvaluateMetricInfoBox
              metric={"Cross entropy"}
              value={crossEntropy}
              link="https://en.wikipedia.org/wiki/Cross_entropy"
            />
          </Grid>
          <Grid item xs={3}>
            <EvaluateMetricInfoBox
              metric={"Precision"}
              value={precision}
              link="https://en.wikipedia.org/wiki/Precision_and_recall"
            />
          </Grid>
          <Grid item xs={3}>
            <EvaluateMetricInfoBox
              metric={"Recall"}
              value={recall}
              link="https://en.wikipedia.org/wiki/Precision_and_recall"
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
