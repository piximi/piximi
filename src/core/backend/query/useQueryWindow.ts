import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { QueryWindowController } from "./windowController";

import type { WindowFetch, WindowSnapshot } from "./windowController";

export type WindowSource<R> = { key: string; fetch: WindowFetch<R> };

export type QueryWindow<R> = WindowSnapshot<R> & {
  setRange: (start: number, end: number) => void;
};

/*
 * A query window as React state: pass a memoized source (its `key` names
 * the query; a new key starts over) and the data revision, and tell it
 * which item indices are on screen.
 */
export const useQueryWindow = <R>(
  source: WindowSource<R>,
  revision: number,
): QueryWindow<R> => {
  const [controller] = useState(() => new QueryWindowController<R>());

  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => {
    controller.setSource(source.key, source.fetch);
  }, [controller, source]);
  useEffect(() => {
    controller.setRevision(revision);
  }, [controller, revision]);

  const subscribe = useCallback(
    (listener: () => void) => controller.subscribe(listener),
    [controller],
  );
  const getSnapshot = useCallback(() => controller.getSnapshot(), [controller]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const setRange = useCallback(
    (start: number, end: number) => controller.setRange(start, end),
    [controller],
  );
  return { ...snapshot, setRange };
};
