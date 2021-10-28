import React, { useState } from "react";

export const useMarchingAnts = () => {
  const [dashOffset, setDashOffset] = useState<number>(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDashOffset(dashOffset + 1);

      if (dashOffset > 32) {
        setDashOffset(0);
      }
    }, 200);
    return () => clearTimeout(timer);
  });

  return dashOffset;
};
