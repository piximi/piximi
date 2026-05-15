import type { Run, RunHyperparameterSnapshot } from "store/classifier/types";
const formatInputShape = (
  shape: RunHyperparameterSnapshot["preprocess"]["inputShape"],
) =>
  Object.values(shape).reduce<string>(
    (disp, v, idx) => disp + v + (idx === 3 ? "]" : ", "),
    "[",
  );

type ExportColumn = {
  label: string;
  get: (run: Run, idx: number) => string | number | undefined;
};

const exportColumns: readonly ExportColumn[] = [
  { label: "Run", get: (_run, idx) => idx + 1 },
  { label: "When", get: (run) => new Date(run.startedAt).toLocaleString() },
  { label: "Trigger", get: (run) => run.trigger },
  { label: "Seed", get: (run) => run.seed },
  { label: "Epochs Completed", get: (run) => run.history.length },
  { label: "Final Loss", get: (run) => run.history.at(-1)?.loss.toFixed(3) },
  {
    label: "Final Accuracy",
    get: (run) => run.history.at(-1)?.accuracy.toFixed(3),
  },
  { label: "Epochs", get: (run) => run.hyperparameters.optimizer.epochs },
  {
    label: "Batch Size",
    get: (run) => run.hyperparameters.optimizer.batchSize,
  },
  {
    label: "Learning Rate",
    get: (run) => run.hyperparameters.optimizer.learningRate,
  },
  {
    label: "Loss Function",
    get: (run) => {
      const lossFunction = run.hyperparameters.optimizer.lossFunction;
      if (typeof lossFunction === "string") return lossFunction;
      else if (Array.isArray(lossFunction)) return lossFunction[0];
      return Object.values(lossFunction)[0];
    },
  },
  { label: "Metrics", get: (run) => run.hyperparameters.optimizer.metrics[0] },
  {
    label: "Algorithm",
    get: (run) => run.hyperparameters.optimizer.optimizationAlgorithm,
  },
  {
    label: "Input Shape",
    get: (run) => formatInputShape(run.hyperparameters.preprocess.inputShape),
  },
  {
    label: "Shuffle",
    get: (run) => String(run.hyperparameters.preprocess.shuffle),
  },
  {
    label: "Normalized",
    get: (run) =>
      String(run.hyperparameters.preprocess.normalizeOptions.normalize),
  },
  {
    label: "Centered",
    get: (run) =>
      String(run.hyperparameters.preprocess.normalizeOptions.center),
  },
  {
    label: "Number of Crops",
    get: (run) => run.hyperparameters.preprocess.cropOptions.numCrops,
  },
  {
    label: "Crop Schema",
    get: (run) => run.hyperparameters.preprocess.cropOptions.cropSchema,
  },
  {
    label: "Training Split Percent",
    get: (run) => run.hyperparameters.preprocess.trainingPercentage,
  },
];

const escapeCsvCell = (value: unknown) => {
  const str = value == null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
};

export const buildModelRunsCsv = (runs: Run[]) => {
  const headers = exportColumns.map((c) => c.label).join(",");
  const rows = runs.map((run, idx) =>
    exportColumns.map((c) => escapeCsvCell(c.get(run, idx))).join(","),
  );
  const csvContent = [headers, ...rows].join("\n");
  return csvContent;
};
