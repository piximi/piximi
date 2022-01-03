import React from "react";
import { Selection } from "../Selection";
import { useSelector } from "react-redux";
import {
  annotationStateSelector,
  toolTypeSelector,
} from "../../../../../store/selectors";
import { AnnotationStateType } from "../../../../../types/AnnotationStateType";
import { Tool } from "../../../../../annotator/image/Tool";
import { ToolType } from "../../../../../types/ToolType";

type SelectingProps = {
  tool: Tool;
};

export const Selecting = ({ tool }: SelectingProps) => {
  const annotationState = useSelector(annotationStateSelector);

  const toolType = useSelector(toolTypeSelector);

  if (
    annotationState !== AnnotationStateType.Annotating &&
    toolType !== ToolType.QuickAnnotation
  )
    return <React.Fragment />;

  return <Selection tool={tool} toolType={toolType} />;
};
