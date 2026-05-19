import { useRef, useState } from "react";

import { useSelector } from "react-redux";

import { saveAs } from "file-saver";

import type { TableRowProps } from "@mui/material";
import {
  Box,
  Button,
  Chip,
  Popover,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import {
  selectActiveModelName,
  selectRunsForActiveModel,
} from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";

import { buildModelRunsCsv } from "utils/file-io-v2/export";
import type { RunHyperparameterSnapshot } from "utils/dl/classification/types";

export const RunSummaryTable = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelName = useParameterizedSelector(
    selectActiveModelName,
    modelTarget,
  );
  const runs = useParameterizedSelector(selectRunsForActiveModel, modelTarget);

  const [hypParams, setHypeParams] = useState<RunHyperparameterSnapshot>();
  const hypParamsRef = useRef<HTMLButtonElement | null>(null);

  const handleExportRuns = () => {
    const csvContent = buildModelRunsCsv(runs);
    const data = new Blob([csvContent], { type: "text/csv" });
    saveAs(data, `${modelName}-runs_summary.csv`);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Table
        stickyHeader
        size="small"
        sx={{
          "& td, & th": {
            textAlign: "center",
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Run</TableCell>
            <TableCell>When</TableCell>
            <TableCell>Trigger</TableCell>
            <TableCell>Seed</TableCell>
            <TableCell>Epochs</TableCell>
            <TableCell>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  "& > p": { fontWeight: "inherit" },
                }}
              >
                <Typography variant="body2">Final</Typography>
                <Typography variant="body2">Loss / Acc</Typography>
              </Box>
            </TableCell>
            <TableCell>Hyperparameters</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {runs.map((run, idx) => (
            <TableRow key={run.id}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{new Date(run.startedAt).toLocaleString()}</TableCell>
              <TableCell>
                <Chip label={run.trigger} size="small" />
              </TableCell>
              <TableCell>{run.seed}</TableCell>
              <TableCell>{run.history.length}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", justifyContent: "space-evenly" }}>
                  <Typography variant="body2">
                    {run.history.at(-1)?.loss.toFixed(3)}
                  </Typography>
                  <Typography variant="body2">/</Typography>
                  <Typography variant="body2">
                    {run.history.at(-1)?.accuracy.toFixed(3)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Button
                  variant="text"
                  size="small"
                  onClick={(e) => {
                    hypParamsRef.current = e.currentTarget;
                    setHypeParams(run.hyperparameters);
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Popover
        open={!!hypParamsRef.current}
        anchorEl={hypParamsRef.current}
        onClose={() => {
          hypParamsRef.current = null;
          setHypeParams(undefined);
        }}
        slotProps={{ paper: { sx: { width: "300px" } } }}
      >
        <HyperParameterInfoTable hypParams={hypParams} />
      </Popover>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1,
        }}
      >
        <Button onClick={handleExportRuns} disabled={runs.length === 0}>
          Export Runs Summary
        </Button>
      </Box>
    </Box>
  );
};

const SubRow = styled(TableRow)<TableRowProps>(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  "& > td:first-of-type": {
    paddingLeft: "2rem",
    borderRight: `1px solid ${theme.vars.palette.TableCell.border}`,
  },
  "& > td:nth-of-type(2)": {
    textAlign: "right",
  },
}));
const HyperParameterInfoTable = ({
  hypParams,
}: {
  hypParams?: RunHyperparameterSnapshot;
}) => {
  return !hypParams ? null : (
    <Box
      sx={(theme) => ({
        p: 1,
        bgcolor: theme.palette.background.paper,
      })}
    >
      <TableContainer
        sx={(theme) => ({
          borderRadius: "4px",
          border: `1px solid ${theme.vars.palette.TableCell.border}`,
        })}
      >
        <Table size="small">
          <TableBody>
            <TableRow
              sx={(theme) => ({ bgcolor: theme.palette.background.paper })}
            >
              <TableCell>Optimizer</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <SubRow>
              <TableCell>Epochs</TableCell>
              <TableCell>{hypParams.optimizer.epochs}</TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Batch Size</TableCell>
              <TableCell>{hypParams.optimizer.batchSize}</TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Learning Rate</TableCell>
              <TableCell>{hypParams.optimizer.learningRate}</TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Loss Function</TableCell>
              <TableCell>{hypParams.optimizer.lossFunction}</TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Metrics</TableCell>
              <TableCell>{hypParams.optimizer.metrics[0]}</TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Algorithm</TableCell>
              <TableCell>{hypParams.optimizer.optimizationAlgorithm}</TableCell>
            </SubRow>
            <TableRow
              sx={(theme) => ({ bgcolor: theme.palette.background.paper })}
            >
              <TableCell>Preprocessing</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <SubRow>
              <TableCell>Input Shape {"[z,h,w,c]"}</TableCell>
              <TableCell>
                {Object.values(hypParams.preprocess.inputShape).reduce(
                  (disp: string, v, idx) => disp + v + (idx === 3 ? "]" : ", "),
                  "[",
                )}
              </TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Shuffle</TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {String(hypParams.preprocess.shuffle)}
              </TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Normalized</TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {String(hypParams.preprocess.normalizeOptions.normalize)}
              </TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Centered</TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {String(hypParams.preprocess.normalizeOptions.center)}
              </TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Number of Crops</TableCell>
              <TableCell>{hypParams.preprocess.cropOptions.numCrops}</TableCell>
            </SubRow>
            <SubRow>
              <TableCell>Crop Schema</TableCell>
              <TableCell>
                {hypParams.preprocess.cropOptions.cropSchema}
              </TableCell>
            </SubRow>
            <SubRow
              sx={{
                "& td": {
                  borderBottom: "none",
                },
              }}
            >
              <TableCell>Training Split Percent</TableCell>
              <TableCell>{hypParams.preprocess.trainingPercentage}</TableCell>
            </SubRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
