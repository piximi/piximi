import { useEffect } from "react";

export const useKeyPress = (target: string, callback: () => void) => {
  useEffect(() => {
    function onKeyup(event: any) {
      if (event.key === target) {
        callback();
      }
    }

    window.addEventListener("keyup", onKeyup);

    return () => {
      window.removeEventListener("keyup", onKeyup);
    };
  }, [callback, target]);
};
