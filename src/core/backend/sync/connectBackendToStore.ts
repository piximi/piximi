import { dataSlice } from "store/data";

import type { Dispatch } from "@reduxjs/toolkit";

import type { BackendEvent } from "../events";
import type { Backend } from "../types";

/*
 * Turns a backend event into store updates. The data slice stays the UI's
 * source of truth for metadata; this is how changes the backend originates
 * (segmentation results now, remote edits later) reach it.
 */
const applyBackendEvent = (event: BackendEvent, dispatch: Dispatch): void => {
  switch (event.type) {
    case "kinds/didAdd":
      dispatch(dataSlice.actions.batchAddKind(event.kinds));
      return;
    case "annotations/didAdd":
      dispatch(dataSlice.actions.batchAddAnnotationVolume(event.volumes));
      dispatch(dataSlice.actions.batchAddAnnotation(event.annotations));
      return;
    case "jobs/didUpdate":
      // Jobs are not mirrored into the store yet; callers track their own
      // runs through `appTasks`.
      return;
  }
};

export const connectBackendToStore = (
  backend: Backend,
  store: { dispatch: Dispatch },
): (() => void) =>
  backend.subscribe((event) => applyBackendEvent(event, store.dispatch));
