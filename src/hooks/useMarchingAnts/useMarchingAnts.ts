import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "store/imageViewer";

export const useMarchingAnts = () => {
  const [dashOffset, setDashOffset] = useState<number>(0);
  const stageScale = useSelector(stageScaleSelector);
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
