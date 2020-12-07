import { useEffect, useRef } from "react";

export const useAnimationFrame = (animate: () => void) => {
  const animationRef = useRef<number>();

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current!);
  });
};
