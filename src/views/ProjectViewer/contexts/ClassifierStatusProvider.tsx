import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectClassifierModel } from "store/classifier/reselectors";
import { selectShowClearPredictionsWarning } from "store/classifier/selectors";
import { dataSlice } from "store/data";
import { selectAllKindIds } from "store/data/selectors";
import { GeneralizedKindItem, Kind } from "store/data/types";
import { groupKindItemsBy, isUnknownCategory } from "store/data/utils";
import {
  selectActiveKindItemArray,
  selectActiveUnknownCategoryId,
} from "store/project/reselectors";
import {
  selectActiveKindId,
  selectProjectImageChannels,
} from "store/project/selectors";
import { getDifferences } from "utils/arrayUtils";
import { ModelStatus, Partition } from "utils/models/enums";
import { ErrorContext, ClassifierErrorReason } from "./types";
import { IMAGE_KIND } from "store/data/constants";

const ClassifierStatusContext = createContext<{
  isReady: boolean;
  trainable: boolean;
  modelStatus: ModelStatus;
  setModelStatus: (status: ModelStatus) => void;
  shouldWarnClearPredictions: boolean;
  error?: ErrorContext;
  newModelName: string;
  setNewModelName: React.Dispatch<React.SetStateAction<string>>;
  clearPredictions: () => void;
  acceptPredictions: () => void;
}>({
  isReady: true,
  trainable: true,
  modelStatus: ModelStatus.Idle,
  setModelStatus: (_status) => {},
  shouldWarnClearPredictions: false,
  newModelName: "",
  setNewModelName: (_value: React.SetStateAction<string>) => {},
  clearPredictions: () => {},
  acceptPredictions: () => {},
});

export const ClassifierStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectClassifierModel);
  const activeKindId = useSelector(selectActiveKindId);
  const projectKinds = useSelector(selectAllKindIds);
  const kindItems = useSelector(selectActiveKindItemArray);
  const unknowCatId = useSelector(selectActiveUnknownCategoryId);
  const projectChannels = useSelector(selectProjectImageChannels);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );

  const [isReady, setIsReady] = useState(true);
  const [newModelName, setNewModelName] = useState("");
  const [error, setError] = useState<ErrorContext>();
  const [modelStatusDict, setModelStatusDict] = useState<
    Record<Kind["id"], ModelStatus>
  >({ Image: ModelStatus.Idle });

  const itemsByPartition = useMemo(
    () => groupKindItemsBy("partition", kindItems),
    [kindItems],
  );

  const itemsByLabel = useMemo(
    () => groupKindItemsBy("categoryId", kindItems),
    [kindItems],
  );

  const activeLabeledItems = useMemo(
    () =>
      Object.keys(itemsByLabel).reduce(
        (labeled: GeneralizedKindItem[], label) => {
          if (isUnknownCategory(label)) return labeled;
          return [...labeled, ...itemsByLabel[label]];
        },
        [],
      ),
    [itemsByLabel],
  );

  const labeledItemsCount = useMemo(
    () => activeLabeledItems.length,
    [activeLabeledItems],
  );
  useEffect(() => {
    const classifierKinds = Object.keys(modelStatusDict);

    const kindChanges = getDifferences(classifierKinds, projectKinds);

    const nextStatusDict = { ...modelStatusDict };

    kindChanges.added.forEach(
      (newKind) => (nextStatusDict[newKind] = ModelStatus.Idle),
    );
    kindChanges.removed.forEach(
      (removedKind) => delete nextStatusDict[removedKind],
    );
    setModelStatusDict(nextStatusDict);
  }, [projectKinds]);
  const modelStatus = useMemo(() => {
    return modelStatusDict?.[activeKindId] ?? ModelStatus.Idle;
  }, [activeKindId, modelStatusDict]);
  const setModelStatus = useCallback(
    (status: ModelStatus) => {
      setModelStatusDict((dict) => ({ ...dict, [activeKindId]: status }));
    },
    [activeKindId],
  );

  const hasLabeledInference = useMemo(() => {
    return activeLabeledItems.some(
      (thing) =>
        !isUnknownCategory(thing.categoryId) &&
        thing.partition === Partition.Inference,
    );
  }, [activeLabeledItems]);

  const shouldWarnClearPredictions = useMemo(() => {
    return showClearPredictionsWarning && hasLabeledInference;
  }, [showClearPredictionsWarning, hasLabeledInference]);

  const trainable = useMemo(
    () => !selectedModel || selectedModel.trainable,
    [selectedModel],
  );
  const noLabeledThings = useMemo(
    () => labeledItemsCount === 0,
    [labeledItemsCount],
  );

  const clearPredictions = () => {
    if (!unknowCatId)
      throw new Error(`Invalid Unknown Category Id: ${unknowCatId}.`);
    const inferenceItems = itemsByPartition[Partition.Inference];
    const updates = inferenceItems.reduce(
      (updates: { id: string; changes: { categoryId: string } }[], item) => {
        updates.push({
          id: item.id,
          changes: { categoryId: unknowCatId },
        });
        return updates;
      },
      [],
    );
    if (activeKindId === IMAGE_KIND) {
      dispatch(dataSlice.actions.batchUpdateImageData(updates));
    } else {
      dispatch(dataSlice.actions.batchUpdateAnnotations(updates));
    }
  };

  const acceptPredictions = () => {
    const inferenceItems = itemsByPartition[Partition.Inference];

    if (activeKindId === IMAGE_KIND) {
      const handledImages: string[] = [];
      const updates = inferenceItems.reduce(
        (updates, item) => {
          if (
            isUnknownCategory(item.categoryId) ||
            handledImages.includes(item.id)
          )
            return updates;
          updates.push({
            id: item.id,
            changes: { partition: Partition.Unassigned },
          });
          handledImages.push(item.id);
          return updates;
        },
        [] as { id: string; changes: { partition: Partition } }[],
      );
      dispatch(dataSlice.actions.batchUpdateImageData(updates));
    } else {
      const updates = inferenceItems.reduce(
        (updates, item) => {
          if (isUnknownCategory(item.categoryId)) return updates;
          updates.push({
            id: item.id,
            changes: { partition: Partition.Unassigned },
          });
          return updates;
        },
        [] as { id: string; changes: { partition: Partition } }[],
      );
      dispatch(dataSlice.actions.batchUpdateAnnotations(updates));
    }
  };

  useEffect(() => {
    const newErrors: ErrorContext[] = [];
    let newIsReady = true;

    if (!trainable) {
      newIsReady = false;

      newErrors.push({
        reason: ClassifierErrorReason.NotTrainable,
        message: "Selected model is not trainable.",
        severity: 1,
      });
    }
    if (noLabeledThings) {
      newIsReady = false;

      newErrors.push({
        reason: ClassifierErrorReason.NoLabeledImages,
        message: "Please label images to train a model.",
        severity: 3,
      });
    }
    if (
      selectedModel?.preprocessingOptions &&
      projectChannels &&
      projectChannels !== selectedModel.preprocessingOptions.inputShape.channels
    ) {
      newIsReady = false;

      newErrors.push({
        reason: ClassifierErrorReason.ChannelMismatch,
        message: `The model requires ${selectedModel?.preprocessingOptions.inputShape.channels}-channel images, but the project images have ${projectChannels}`,
        severity: 2,
      });
    }

    const mostSevere: undefined | ErrorContext =
      newErrors.length === 0
        ? undefined
        : newErrors.reduce((prev, curr) =>
            curr.severity < prev.severity ? curr : prev,
          );
    setIsReady(newIsReady);
    setError(mostSevere);
  }, [
    selectedModel,
    trainable,
    noLabeledThings,
    projectChannels,
    activeKindId,
  ]);

  return (
    <ClassifierStatusContext.Provider
      value={{
        isReady,
        trainable,
        modelStatus,
        setModelStatus,
        shouldWarnClearPredictions,
        error,
        newModelName,
        setNewModelName,
        clearPredictions,
        acceptPredictions,
      }}
    >
      {children}
    </ClassifierStatusContext.Provider>
  );
};

export const useClassifierStatus = () => {
  return useContext(ClassifierStatusContext);
};
