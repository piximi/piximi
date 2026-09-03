import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectRunsForActiveModel } from "store/classifier/selectors";
import { diffCompileSettings } from "@ProjectViewer/sections/ModelTaskSection/ClassifierSection/FitClassifierDialog/panels/ModelSettings/HyperparameterSettings/settingsLock";

import type { Points } from "utils/types";

import type { OptimizationAlgorithm } from "core/dl/enums";

export type RunDrift = {
  epoch: number;
  drift: {
    optimizationAlgorithm?: [OptimizationAlgorithm, OptimizationAlgorithm];
    learningRate?: [number, number];
  };
};
type HistoryData = {
  categoricalAccuracy: Points;
  val_categoricalAccuracy: Points;
  loss: Points;
  val_loss: Points;
};

const initialModelHistory = (): HistoryData => ({
  categoricalAccuracy: [],
  val_categoricalAccuracy: [],
  loss: [],
  val_loss: [],
});

const ClassifierHistoryContext = createContext<{
  modelHistory: HistoryData;
  currentEpoch: number;
  totalEpochs: number;
  setTotalEpochs: React.Dispatch<React.SetStateAction<number>>;
  runDrifts: RunDrift[];
}>({
  modelHistory: initialModelHistory(),
  currentEpoch: 0,
  totalEpochs: 0,
  setTotalEpochs: (_value: React.SetStateAction<number>) => {},
  runDrifts: [],
});

export const ClassifierHistoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const previousRuns = useParameterizedSelector(
    selectRunsForActiveModel,
    modelTarget,
  );
  const [totalEpochs, setTotalEpochs] = useState<number>(0);

  // Single source of truth: the persisted runs in redux. Recomputes on every
  // appendEpochToActiveRun dispatch — Immer gives us new references along the
  // path state → ... → runs → runs[-1] → history, so the `[previousRuns]` dep
  // sees a new array reference and the memo re-runs. Training metrics are
  // plotted at `epoch + 0.5`, validation at the integer epoch.
  const modelHistory = useMemo<HistoryData>(() => {
    const out = initialModelHistory();
    let i = 0;
    for (const run of previousRuns) {
      for (const ep of run.history) {
        i += 1;
        out.loss.push({ x: i - 0.5, y: ep.loss });
        out.val_loss.push({ x: i, y: ep.valLoss });
        out.categoricalAccuracy.push({ x: i - 0.5, y: ep.accuracy });
        out.val_categoricalAccuracy.push({ x: i, y: ep.valAccuracy });
      }
    }
    return out;
  }, [previousRuns]);

  const runDrifts = useMemo(() => {
    const runDrifts: RunDrift[] = [];
    let epochs = 0;
    for (let runIdx = 0; runIdx < previousRuns.length; runIdx++) {
      const curr = previousRuns[runIdx];
      if (runIdx === 0) {
        epochs += curr.history.length;
        continue;
      }
      const prev = previousRuns[runIdx - 1];
      const optimizerDiff = diffCompileSettings(
        prev.hyperparameters.optimizer,
        curr.hyperparameters.optimizer,
      );
      if (optimizerDiff.changed) {
        runDrifts.push({
          epoch: epochs + 0.5,
          drift: {
            optimizationAlgorithm: optimizerDiff.optimizationAlgorithm,
            learningRate: optimizerDiff.learningRate,
          },
        });
      }
      epochs += curr.history.length;
    }
    return runDrifts;
    // including only `previousRuns.length` as the deps means this wont refire if
    // the `Run` object changes, only when a run is appended.
    // this is ok since we only care about `hyperparameters.optimizer`
    // and then never changes after the `Run` is added
  }, [previousRuns.length]);

  const currentEpoch = modelHistory.val_categoricalAccuracy.length;

  return (
    <ClassifierHistoryContext.Provider
      value={{
        modelHistory,
        currentEpoch,
        totalEpochs,
        setTotalEpochs,
        runDrifts,
      }}
    >
      {children}
    </ClassifierHistoryContext.Provider>
  );
};

export const useClassifierHistory = () => {
  return useContext(ClassifierHistoryContext);
};
