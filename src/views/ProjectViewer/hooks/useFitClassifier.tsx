import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";

import { selectKindClassifier } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";
import { classifierSlice } from "store/classifier";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { selectActiveKnownCategories } from "@ProjectViewer/state/reselectors";

import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";
import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

import type { Classifier } from "core/dl/classification/types";

/*
 * Trains the active classifier, or a new one from the dialog's settings.
 * The backend chooses and partitions the items, keeps the run and announces
 * each epoch; the slice follows, which is what the plots read.
 */
export const useFitClassifier = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );
  const knownCategories = useSelector(selectActiveKnownCategories);

  const { setTotalEpochs } = useClassifierHistory();
  const { newModelName, modelParams, userDefinedSeed } = useClassifierStatus();
  const { getClassMap } = useClassMapDialog();
  const handleError = useClassifierErrorHandler();

  const setStatus = (status: "loading" | "training" | "idle") =>
    dispatch(
      classifierSlice.actions.setModelStatus({ targetId: modelTarget, status }),
    );

  const fitClassifier = async () => {
    const { classification } = backend;
    if (!classification) return;
    const activeId = kindClassifier.activeModel;
    let record: Classifier | undefined = activeId
      ? kindClassifier.modelInfoDict[activeId]
      : undefined;
    const optimizer =
      record?.hyperparameters.optimizer ?? modelParams.optimizerSettings;
    const epochsSoFar =
      record?.runs.reduce(
        (total, run) => total + run.hyperparameters.optimizer.epochs,
        0,
      ) ?? 0;
    setTotalEpochs(epochsSoFar + optimizer.epochs);

    setStatus("loading");
    try {
      if (!record) {
        const architectures = (await classification.listArchitectures()).filter(
          (model) => model.tasks.includes("classification.train"),
        );
        const architectureId = architectures.some(
          (model) => model.name === kindClassifier.newModelArch,
        )
          ? kindClassifier.newModelArch
          : architectures[0]?.name;
        if (!architectureId) {
          throw new Error("This backend offers no trainable architecture");
        }
        record = await classification.create({
          targetId: modelTarget,
          name: newModelName,
          architectureId,
          hyperparameters: {
            preprocess: modelParams.preprocessSettings,
            optimizer: modelParams.optimizerSettings,
          },
          seed: userDefinedSeed,
        });
        dispatch(
          classifierSlice.actions.setActiveModel({
            targetId: modelTarget,
            modelName: record.id,
          }),
        );
      } else if (record.trained && !record.classMap) {
        // A loaded model names its classes; the user says which category
        // each one is before it can learn more.
        const mapping = await getClassMap({
          projectCategories: knownCategories,
          modelClasses: record.classes,
        });
        if (!mapping) throw new Error("Class mapping needed for training");
        record = await classification.update({
          classifierId: record.id,
          classMap: mapping,
        });
      }
      setStatus("training");
      const summary = await classification.fit({
        classifierId: record.id,
        seed: userDefinedSeed,
      });
      if (summary.status === "failed") throw new Error("Training failed");
    } catch (error) {
      handleError(error as Error, "Training Error");
    } finally {
      setStatus("idle");
    }
  };

  return fitClassifier;
};
