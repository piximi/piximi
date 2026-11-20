import { useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { useBackendQuery } from "core/backend/query";
import { Partition, representsUnknown } from "core/entities";

import { selectDataRevision } from "store/backendSync";

import {
  selectActiveKindId,
  selectActiveView,
} from "@ProjectViewer/state/selectors";

import type { Counts } from "core/backend";

export type ClassifierCounts = {
  /* Items with a category other than unknown. */
  labeled: number;
  /* Categories holding a labeled item that is not a pending prediction. */
  labeledCategories: number;
  /* Predicted items not yet accepted or cleared. */
  pendingPredictions: number;
  unlabeled: number;
  loaded: boolean;
};

const unknownCount = (counts: Counts | undefined): number =>
  Object.entries(counts?.groups ?? {})
    .filter(([id]) => representsUnknown(id))
    .reduce((total, [, count]) => total + count, 0);

/*
 * What the classifier panel needs to know about the active target's items,
 * asked of the backend rather than counted over the store: a remote
 * project's objects are not mirrored, and its counts are what the engine
 * would train on.
 */
export const useClassifierCounts = (): ClassifierCounts => {
  const backend = useBackend();
  const revision = useSelector(selectDataRevision);
  const view = useSelector(selectActiveView);
  const kindId = useSelector(selectActiveKindId);
  const scope = view === "images" ? "images" : `kind:${kindId}`;

  const all = useBackendQuery(
    `classifierCounts:${scope}:all`,
    () =>
      view === "images"
        ? backend.query.imageCounts({}, "category")
        : backend.query.annotationCounts({ kindIds: [kindId] }, "category"),
    revision,
  ).value;
  const inference = useBackendQuery(
    `classifierCounts:${scope}:inference`,
    () =>
      view === "images"
        ? backend.query.imageCounts(
            { partitions: [Partition.Inference] },
            "category",
          )
        : backend.query.annotationCounts(
            { kindIds: [kindId], partitions: [Partition.Inference] },
            "category",
          ),
    revision,
  ).value;

  const unlabeled = unknownCount(all);
  const pendingPredictions = (inference?.total ?? 0) - unknownCount(inference);
  const labeledCategories = Object.entries(all?.groups ?? {}).filter(
    ([id, count]) =>
      !representsUnknown(id) && count - (inference?.groups?.[id] ?? 0) > 0,
  ).length;
  return {
    labeled: (all?.total ?? 0) - unlabeled,
    labeledCategories,
    pendingPredictions,
    unlabeled,
    loaded: all !== undefined && inference !== undefined,
  };
};
