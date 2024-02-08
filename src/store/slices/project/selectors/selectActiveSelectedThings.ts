import { selectKindDictionary } from "store/slices/newData/selectors/selectors";
import { selectActiveKind, selectSelectedThingIds } from "../selectors";
import { createSelector } from "@reduxjs/toolkit";
import { intersection } from "lodash";
import { Project } from "types";

export const selectSelectedThingIdsLength = ({
  project,
}: {
  project: Project;
}) => {
  return project.selectedImageIds.length;
};

export const selectActiveSelectedThings = createSelector(
  selectActiveKind,
  selectSelectedThingIds,
  selectKindDictionary,
  selectSelectedThingIdsLength,
  (activeKind, selectedThings, kindDict, len) => {
    const thingsInKind = kindDict[activeKind].containing;
    const selectedThingsOfKind = intersection(thingsInKind, selectedThings);

    return selectedThingsOfKind;
  }
);
