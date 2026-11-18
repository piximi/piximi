import {
  useCallback,
  useEffect,
  useEffectEvent,
  useSyncExternalStore,
} from "react";

/* An unsettled entry may carry the previous revision's value meanwhile. */
type Entry = { value?: unknown; error?: unknown; settled: boolean };

const MAX_ENTRIES = 200;
const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();

const notify = (key: string) => {
  for (const listener of listeners.get(key) ?? []) listener();
};

const remember = (key: string, entry: Entry) => {
  if (!entries.has(key) && entries.size >= MAX_ENTRIES) {
    entries.delete(entries.keys().next().value!);
  }
  entries.set(key, entry);
};

/*
 * One backend query result, shared by every component that asks for the
 * same key and fetched again when the data revision moves. The last value
 * stays available while the next one loads, so counts and badges never
 * flash empty on a change.
 */
export const useBackendQuery = <T>(
  key: string | null,
  fetch: () => Promise<T>,
  revision: number,
): { value: T | undefined; loading: boolean } => {
  const entryKey = key === null ? null : `${key}@${revision}`;

  const subscribe = useCallback(
    (listener: () => void) => {
      if (entryKey === null) return () => {};
      let set = listeners.get(entryKey);
      if (!set) listeners.set(entryKey, (set = new Set()));
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(entryKey);
      };
    },
    [entryKey],
  );
  const getSnapshot = useCallback(
    () => (entryKey === null ? undefined : entries.get(entryKey)),
    [entryKey],
  );
  const entry = useSyncExternalStore(subscribe, getSnapshot);

  const run = useEffectEvent(fetch);
  useEffect(() => {
    if (entryKey === null || entries.has(entryKey)) return;
    // The previous revision's value stands in until this one answers.
    let previous: unknown;
    for (const other of [...entries.keys()]) {
      if (other !== entryKey && other.startsWith(`${key}@`)) {
        previous = entries.get(other)?.value;
        entries.delete(other);
      }
    }
    remember(entryKey, { value: previous, settled: false });
    notify(entryKey);
    run().then(
      (value) => {
        remember(entryKey, { value, settled: true });
        notify(entryKey);
      },
      (error: unknown) => {
        console.error(error);
        remember(entryKey, { error, settled: true });
        notify(entryKey);
      },
    );
  }, [entryKey, key]);

  return { value: entry?.value as T | undefined, loading: !entry?.settled };
};
