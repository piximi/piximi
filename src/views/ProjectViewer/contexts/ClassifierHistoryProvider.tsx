import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { selectClassifierModel } from "store/classifier/reselectors";
import { logger } from "utils/logUtils";
import { Points } from "utils/types";
import { TrainingCallbacks } from "utils/models/types";

type HistoryData = {
  categoricalAccuracy: Points;
  val_categoricalAccuracy: Points;
  loss: Points;
  val_loss: Points;
};

const initialModelHistory = () => ({
  categoricalAccuracy: [],
  val_categoricalAccuracy: [],
  loss: [],
  val_loss: [],
});

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
  const selectedModel = useSelector(selectClassifierModel);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [totalEpochs, setTotalEpochs] = useState<number>(0);
  const [modelHistory, setModelHistory] = useState<HistoryData>(
    initialModelHistory(),
  );
  const [predictedProbabilities, setPredictedProbabilities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!selectedModel) {
      setModelHistory(initialModelHistory());
      setCurrentEpoch(0);
      setTotalEpochs(0);
      return;
    }
    const fullHistory = selectedModel.history.history;
    const data = fullHistory.reduce(
      (data: HistoryData, epoch) => {
        for (const key in epoch) {
          const cycleData = epoch[key];

          data[key as keyof HistoryData].push(
            ...generatePlotData(cycleData, key as keyof HistoryData),
          );
        }
        return data;
      },
      {
        categoricalAccuracy: [],
        val_categoricalAccuracy: [],
        loss: [],
        val_loss: [],
      },
    );
    setModelHistory(data);
    if (fullHistory.length > 1) {
      setTotalEpochs(fullHistory.length);

      setCurrentEpoch(fullHistory.length);
    }
  }, [selectedModel]);

  const epochEndCallback: TrainingCallbacks["onEpochEnd"] = useCallback(
    async (epoch, logs) => {
      let nextEpoch: number;

      if (!selectedModel) {
        nextEpoch = epoch + 1;
      } else {
        nextEpoch = selectedModel.numEpochs + epoch + 1;
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
    [selectedModel],
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
