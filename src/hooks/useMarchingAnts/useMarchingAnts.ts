import { useLayoutEffect, useState } from "react";

export const useMarchingAnts = () => {
  const [dashOffset, setDashOffset] = useState<number>(0);

  useLayoutEffect(() => {
    let timerId: number;
    const f = () => {
      timerId = requestAnimationFrame(f);
      setDashOffset((prev) => (prev + 10) % 32);
    };

    timerId = requestAnimationFrame(f);

    return () => cancelAnimationFrame(timerId);
  });

  return dashOffset;
};
