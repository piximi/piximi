import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectRunsForActiveModel } from "store/classifier/selectors";

import type { Points } from "utils/types";

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
  predictedProbabilities: Record<string, number>;
  setPredictedProbabilities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}>({
  modelHistory: initialModelHistory(),
  currentEpoch: 0,
  totalEpochs: 0,
  setTotalEpochs: (_value: React.SetStateAction<number>) => {},
  predictedProbabilities: {},
  setPredictedProbabilities: (
    _value: React.SetStateAction<Record<string, number>>,
  ) => {},
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
  const [predictedProbabilities, setPredictedProbabilities] = useState<
    Record<string, number>
  >({});

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

  const currentEpoch = modelHistory.val_categoricalAccuracy.length;

  return (
    <ClassifierHistoryContext.Provider
      value={{
        modelHistory,
        currentEpoch,
        totalEpochs,
        setTotalEpochs,
        predictedProbabilities,
        setPredictedProbabilities,
      }}
    >
      {children}
    </ClassifierHistoryContext.Provider>
  );
};

export const useClassifierHistory = () => {
  return useContext(ClassifierHistoryContext);
};
