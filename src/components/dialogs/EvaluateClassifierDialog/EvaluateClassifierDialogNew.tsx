import { Dialog, DialogContent, Stack, Typography, Grid } from "@mui/material";
import { EvaluationMetricsInfoBox } from "./EvaluationMetricsInfoBox";
import { ConfusionMatrixNew } from "./ConfusionMatrixNew";
import { useSelector } from "react-redux";
import { selectClassifierEvaluationResult } from "store/slices/classifier";
import { Category } from "types";
import { selectActiveKnownCategories } from "store/slices/newData/selectors/reselectors";
import { DialogTransitionSlide } from "components/dialogs";
import { EvaluateClassifierDialogAppBarNew } from "./EvaluateClassifierAppBar";

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
      TransitionComponent={DialogTransitionSlide}
      sx={{ zIndex: 1203, height: "100%" }}
    >
      <EvaluateClassifierDialogAppBarNew closeDialog={closeDialog} />

      <DialogContent>
        <Grid
          container
          direction="row"
          justifyContent="space-evenly"
          alignItems="flex-start"
        >
          <ConfusionMatrixNew
            classNames={categories.map((c: Category) => c.name)}
            confusionMatrix={evaluationResults.confusionMatrix}
          />

          <div>
            <Typography align={"center"} variant="body1" sx={{ mb: 2 }}>
              Evaluation metrics:
            </Typography>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Accuracy"}
                value={evaluationResults.accuracy}
                link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
              />
              <EvaluationMetricsInfoBox
                metric={"Cross entropy"}
                value={evaluationResults.crossEntropy}
                link="https://en.wikipedia.org/wiki/Cross_entropy"
              />
            </Stack>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Precision"}
                value={evaluationResults.precision}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
              <EvaluationMetricsInfoBox
                metric={"Recall"}
                value={evaluationResults.recall}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
            </Stack>
            <EvaluationMetricsInfoBox
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