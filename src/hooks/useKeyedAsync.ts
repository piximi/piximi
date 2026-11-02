import { useEffect, useEffectEvent, useState } from "react";

export function useKeyedAsync<T>(
  key: string | null,
  load: () => Promise<T | undefined>,
) {
  const [settled, setSettled] = useState<{
    key: string;
    value: T | undefined;
  } | null>(null);
  const runLoad = useEffectEvent(load);
  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    runLoad().then(
      (value) => {
        if (!cancelled) setSettled({ key, value });
      },
      (error) => {
        console.error(error);
        if (!cancelled) setSettled({ key, value: undefined });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);
  const current = settled?.key === key ? settled : null;
  return {
    value: current?.value,
    latest: settled?.value,
    loading: key !== null && current === null,
  };
}
