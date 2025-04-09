import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSelector } from "react-redux";
import {
  selectClassifierModel,
  selectClassifierStatus,
} from "store/classifier/reselectors";
import { logger } from "utils/common/helpers";
import { Points } from "utils/common/types";
import { ModelStatus } from "utils/models/enums";
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
}>({
  modelHistory: initialModelHistory(),
  epochEndCallback: async (epoch: number, logs: any) => {
    logger(`Epcoch: ${epoch}`);
    logger(logs);
  },
  currentEpoch: 0,
  setCurrentEpoch: (_value: React.SetStateAction<number>) => {},
});

export const ClassifierHistoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const modelStatus = useSelector(selectClassifierStatus);
  const selectedModel = useSelector(selectClassifierModel);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [modelHistory, setModelHistory] = useState<HistoryData>(
    initialModelHistory()
  );

  useEffect(() => {
    if (!selectedModel) {
      setModelHistory(initialModelHistory());
      return;
    }
    const fullHistory = selectedModel.history.history;
    const data = fullHistory.reduce(
      (data: HistoryData, epoch) => {
        for (const key in epoch) {
          const cycleData = epoch[key];

          data[key as keyof HistoryData].push(
            ...generatePlotData(cycleData, key as keyof HistoryData)
          );
        }
        return data;
      },
      {
        categoricalAccuracy: [],
        val_categoricalAccuracy: [],
        loss: [],
        val_loss: [],
      }
    );
    setModelHistory(data);

    setCurrentEpoch(0);
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

      setCurrentEpoch((currentEpoch) => currentEpoch + 1);

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
          x: trainingEpochIndicator,
          y: logs.val_categoricalAccuracy as number,
        }),
        loss: prevState.loss.concat({
          x: trainingEpochIndicator,
          y: logs.loss as number,
        }),
        val_loss: prevState.val_loss.concat({
          x: trainingEpochIndicator,
          y: logs.val_loss as number,
        }),
      }));
    },
    []
  );
  useEffect(() => {
    if (modelStatus === ModelStatus.Uninitialized) {
      setModelHistory(initialModelHistory());
    }
  }, [modelStatus]);
  useEffect(() => {
    console.log("currentEpoch:", currentEpoch);
  }, [modelHistory]);

  return (
    <ClassifierHistoryContext.Provider
      value={{
        modelHistory: modelHistory,
        epochEndCallback,
        currentEpoch,
        setCurrentEpoch,
      }}
    >
      {children}
    </ClassifierHistoryContext.Provider>
  );
};

export const useClassifierHistory = () => {
  return useContext(ClassifierHistoryContext);
};
