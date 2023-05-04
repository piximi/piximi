import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectToolType } from "store/annotator/selectors";

import { ToolType } from "types";

export const useHandTool = () => {
  const toolType = useSelector(selectToolType);

  const [draggable, setDraggable] = useState<boolean>(false);

  useEffect(() => {
    if (toolType === ToolType.Hand) {
      setDraggable(true);
    } else {
      setDraggable(false);
    }
  }, [toolType]);

  return { draggable };
};
