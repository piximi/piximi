import { useState } from "react";
import { useKeyPress } from "../useKeyPress/useKeyPress";

export const useSelection = (onSelection: () => void) => {
  const [annotated, setAnnotated] = useState<boolean>(false);
  const [annotating, setAnnotating] = useState<boolean>(false);

  useKeyPress("Enter", () => {
    onSelection();

    setAnnotated(false);

    setAnnotating(false);
  });

  useKeyPress("Escape", () => {
    setAnnotated(false);

    setAnnotating(false);
  });

  return {
    annotated: annotated,
    annotating: annotating,
    setAnnotated: setAnnotated,
    setAnnotating: setAnnotating,
  };
};
