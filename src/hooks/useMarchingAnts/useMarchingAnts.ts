import { useContext, useLayoutEffect, useState } from "react";
import { StageContext } from "views/ImageViewer/ImageViewer";

export const useMarchingAnts = () => {
  const [dashOffset, setDashOffset] = useState<number>(0);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;
  useLayoutEffect(() => {
    let timerId: number;
    const f = () => {
      timerId = requestAnimationFrame(f);
      setDashOffset((prev) => (prev + 5 / stageScale) % 32);
    };

    timerId = requestAnimationFrame(f);

    return () => cancelAnimationFrame(timerId);
  });

  return dashOffset;
};
