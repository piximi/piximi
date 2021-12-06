import React from "react";
import { Selection } from "../Selection";
import { useSelector } from "react-redux";
import { annotatedSelector } from "../../../../../store/selectors/annotatedSelector";
import {
  annotatingSelector,
  toolTypeSelector,
} from "../../../../../store/selectors";
import { Tool } from "../../../../../annotator/image/Tool";
import { ToolType } from "../../../../../types/ToolType";

type SelectingProps = {
  tool: Tool;
};

export const Selecting = ({ tool }: SelectingProps) => {
  const annotated = useSelector(annotatedSelector);

  const annotating = useSelector(annotatingSelector);

  const toolType = useSelector(toolTypeSelector);

  if ((annotated || !annotating) && toolType !== ToolType.QuickAnnotation)
    return <React.Fragment />;

  return <Selection tool={tool} toolType={toolType} />;
};
