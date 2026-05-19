import { useMemo, useState } from "react";

import { useSelector } from "react-redux";

import {
  Dialog,
  DialogContent,
  Stack,
  Typography,
  Box,
  Pagination,
  Tooltip,
  PaginationItem,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { DialogTransitionSlide } from "components/dialogs";

import { selectActiveKnownCategories } from "@ProjectViewer/state/reselectors";
import type { Category } from "store/dataV2/types";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectActiveModelName,
  selectRunsForActiveModel,
} from "store/classifier/selectors";

import type { RequireField } from "utils/types";
import type { Run } from "utils/dl/classification/types";

import { EvaluationMetricsInfoBox } from "./EvaluationMetricsInfoBox";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { EvaluateClassifierDialogAppBar } from "./EvaluateClassifierAppBar";

type RunWithEval = RequireField<Run, "evalResults">;
type EvaluateClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const EvaluateClassifierDialog = ({
  closeDialog,
  openedDialog,
}: EvaluateClassifierDialogProps) => {
  const categories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);

  const modelName = useParameterizedSelector(
    selectActiveModelName,
    modelTarget,
  );

  const runs = useParameterizedSelector(selectRunsForActiveModel, modelTarget);

  // runIndices keeps the Paginator honest, so if a run is missing that will be
  // obvious to the user
  const { validRuns, runIndices } = useMemo(() => {
    const validRuns: RunWithEval[] = [];
    const runIndices: number[] = [];
    runs.forEach((run, idx) => {
      if (run.evalResults) {
        validRuns.push(run as RunWithEval);
        runIndices.push(idx);
      }
    });
    return { validRuns, runIndices };
  }, [runs]);

  const [page, setPage] = useState(0);

  const selectedRun = useMemo(() => validRuns[page], [validRuns, page]);
  const validationWarning = useMemo(() => {
    if (page === 0 || !selectedRun) return;
    const previousRun = validRuns[page - 1];
    if (
      previousRun?.validationFingerprint !== selectedRun.validationFingerprint
    ) {
      return `This run's validation set differs from the previous run. Metric differences may reflect changes in evaluation data, not model performance alone.`;
    } else {
      return;
    }
  }, [validRuns, page, selectedRun]);
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number,
  ) => {
    setPage(page - 1);
  };

  return validRuns.length === 0 || !selectedRun ? null : (
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
        <Typography variant="body2">{modelName}</Typography>

        <Box display="flex" flexDirection="row" alignItems="center">
          {!!validationWarning && (
            <Tooltip title={validationWarning}>
              <WarningAmberRoundedIcon
                fontSize="small"
                color="warning"
                sx={{ mr: 1 }}
              />
            </Tooltip>
          )}
          <Typography variant="body2">Evaluation Result</Typography>
          <Pagination
            count={validRuns.length}
            page={page + 1}
            onChange={handlePageChange}
            renderItem={(item) => {
              if (item.type === "page" && item.page !== null) {
                const actualRunNumber = runIndices[item.page - 1] + 1;
                return <PaginationItem {...item} page={actualRunNumber} />;
              }
              return <PaginationItem {...item} />;
            }}
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
            confusionMatrix={selectedRun.evalResults.confusionMatrix}
          />

          <div>
            <Typography align={"center"} variant="body1" sx={{ mb: 2 }}>
              Evaluation metrics:
            </Typography>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Accuracy"}
                value={selectedRun.evalResults.accuracy}
                link="https://en.wikipedia.org/wiki/Accuracy_and_precision"
              />
              <EvaluationMetricsInfoBox
                metric={"Cross entropy"}
                value={selectedRun.evalResults.crossEntropy}
                link="https://en.wikipedia.org/wiki/Cross_entropy"
              />
            </Stack>
            <Stack spacing={1} direction="row">
              <EvaluationMetricsInfoBox
                metric={"Precision"}
                value={selectedRun.evalResults.precision}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
              <EvaluationMetricsInfoBox
                metric={"Recall"}
                value={selectedRun.evalResults.recall}
                link="https://en.wikipedia.org/wiki/Precision_and_recall"
              />
            </Stack>
            <EvaluationMetricsInfoBox
              metric={"F1-score"}
              value={selectedRun.evalResults.f1Score}
              link="https://en.wikipedia.org/wiki/F-score"
            />
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
