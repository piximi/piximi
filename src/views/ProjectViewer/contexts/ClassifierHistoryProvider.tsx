import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSelector } from "react-redux";

import type { RunHistoryEpoch } from "store/classifier/types";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectKindClassifier,
  selectRunsForActiveModel,
} from "store/classifier/selectors";

import { logger } from "utils/logUtils";
import type { Points } from "utils/types";
import type { TrainingCallbacks } from "utils/dl/types";
import classifierHandler from "utils/dl/classification/classifierHandler";

type HistoryData = {
  categoricalAccuracy: Points;
  val_categoricalAccuracy: Points;
  loss: Points;
  val_loss: Points;
};
type RawHistoryData = {
  categoricalAccuracy: number[];
  val_categoricalAccuracy: number[];
  loss: number[];
  val_loss: number[];
};

const initialModelHistory = (): HistoryData => ({
  categoricalAccuracy: [],
  val_categoricalAccuracy: [],
  loss: [],
  val_loss: [],
});
const initialRawHistory = (): RawHistoryData => ({
  categoricalAccuracy: [],
  val_categoricalAccuracy: [],
  loss: [],
  val_loss: [],
});
type RunHistoryKey = keyof Omit<RunHistoryEpoch, "epoch">;
type HistoryDataKey = keyof HistoryData;
const keyLookup: Record<RunHistoryKey, HistoryDataKey> = {
  accuracy: "categoricalAccuracy",
  valAccuracy: "val_categoricalAccuracy",
  loss: "loss",
  valLoss: "val_loss",
};
const generatePlotData = (rawData: number[], dataMetric: keyof HistoryData) => {
  const offset = dataMetric.includes("val_") ? 0.5 : 1;
  return rawData.map((y, i) => ({ x: i + offset, y }));
};

const ClassifierHistoryContext = createContext<{
  modelHistory: HistoryData;
  epochEndCallback: TrainingCallbacks["onEpochEnd"];
  currentEpoch: number;
  setCurrentEpoch: React.Dispatch<React.SetStateAction<number>>;
  totalEpochs: number;
  setTotalEpochs: React.Dispatch<React.SetStateAction<number>>;
  predictedProbabilities: Record<string, number>;
  setPredictedProbabilities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}>({
  modelHistory: initialModelHistory(),
  epochEndCallback: async (epoch: number, logs: any) => {
    logger(`Epcoch: ${epoch}`);
    logger(logs);
  },
  currentEpoch: 0,
  setCurrentEpoch: (_value: React.SetStateAction<number>) => {},
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
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );
  const previousRuns = useParameterizedSelector(
    selectRunsForActiveModel,
    modelTarget.id,
  );
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [totalEpochs, setTotalEpochs] = useState<number>(0);
  const [modelHistory, setModelHistory] = useState<HistoryData>(
    initialModelHistory(),
  );
  const [predictedProbabilities, setPredictedProbabilities] = useState<
    Record<string, number>
  >({});
  const model = useMemo(() => {
    if (!kindClassifier || !kindClassifier.activeModel) return;
    return classifierHandler.getModel(kindClassifier.activeModel);
  }, [kindClassifier?.activeModel]);

  useEffect(() => {
    if (!model) {
      setModelHistory(initialModelHistory());
      setCurrentEpoch(0);
      setTotalEpochs(0);
      return;
    }
    let totalEpochs = 0;
    const rawHistory: RawHistoryData = initialRawHistory();
    const fullHistory = initialModelHistory();

    for (const run of previousRuns) {
      const runHistoryData: RawHistoryData = initialRawHistory();
      const runHistory = run.history;
      for (const epoch of runHistory) {
        for (const key in epoch) {
          if (key === "epoch") continue;
          const runKey = key as RunHistoryKey;
          const cycleData = epoch[runKey];
          const dataKey = keyLookup[runKey];

          runHistoryData[dataKey].push(cycleData);
        }
        totalEpochs++;
      }
      for (const k in rawHistory) {
        const key = k as HistoryDataKey;
        rawHistory[key].push(...runHistoryData[key]);
      }
    }
    for (const k in rawHistory) {
      const key = k as HistoryDataKey;
      fullHistory[key].push(...generatePlotData(rawHistory[key], key));
    }

    setModelHistory(fullHistory);
    if (totalEpochs > 1) {
      setTotalEpochs(totalEpochs);

      setCurrentEpoch(totalEpochs);
    }
  }, [model]);

  const epochEndCallback: TrainingCallbacks["onEpochEnd"] = useCallback(
    async (epoch, logs) => {
      let nextEpoch: number;

      if (!model) {
        nextEpoch = epoch + 1;
      } else {
        nextEpoch = currentEpoch + epoch + 1;
      }
      const trainingEpochIndicator = nextEpoch - 0.5;

      setCurrentEpoch((currentEpoch) => {
        return currentEpoch + 1;
      });

      if (
        !logs ||
        !logs.categoricalAccuracy ||
        !logs.val_categoricalAccuracy ||
        !logs.loss ||
        !logs.val_loss
      )
        return;

      setModelHistory((prevState) => ({
        ...prevState,
        categoricalAccuracy: prevState.categoricalAccuracy.concat({
          x: trainingEpochIndicator,
          y: logs.categoricalAccuracy as number,
        }),
        val_categoricalAccuracy: prevState.val_categoricalAccuracy.concat({
          x: nextEpoch,
          y: logs.val_categoricalAccuracy as number,
        }),
        loss: prevState.loss.concat({
          x: trainingEpochIndicator,
          y: logs.loss as number,
        }),
        val_loss: prevState.val_loss.concat({
          x: nextEpoch,
          y: logs.val_loss as number,
        }),
      }));
    },
    [model],
  );

  return (
    <ClassifierHistoryContext.Provider
      value={{
        modelHistory: modelHistory,
        epochEndCallback,
        currentEpoch,
        setCurrentEpoch,
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
