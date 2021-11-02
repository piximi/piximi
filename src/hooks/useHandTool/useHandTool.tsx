import { useEffect, useState } from "react";
import { ToolType } from "../../types/ToolType";
import { useSelector } from "react-redux";
import { toolTypeSelector } from "../../store/selectors";

export const useHandTool = () => {
  const toolType = useSelector(toolTypeSelector);

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
