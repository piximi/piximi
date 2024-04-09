import { selectKindDictionary } from "store/data/selectors/selectors";
import { selectActiveKindId, selectSelectedThingIds } from "../selectors";
import { createSelector } from "@reduxjs/toolkit";
import { intersection } from "lodash";
import { ProjectState } from "store/types";
import { selectActiveThingIds } from "store/data/selectors/reselectors";

export const selectSelectedThingIdsLength = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.selectedImageIds.length;
};

export const selectActiveSelectedThingIds = createSelector(
  selectSelectedThingIds,
  selectActiveThingIds,
  (selectedIds, activeIds) => {
    return intersection(activeIds, selectedIds);
  }
);

export const selectActiveSelectedThings = createSelector(
  selectActiveKindId,
  selectSelectedThingIds,
  selectKindDictionary,
  selectSelectedThingIdsLength,
  (activeKind, selectedThings, kindDict, len) => {
    const thingsInKind = kindDict[activeKind].containing;
    const selectedThingsOfKind = intersection(thingsInKind, selectedThings);

    return selectedThingsOfKind;
  }
);
