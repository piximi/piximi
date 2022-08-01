import React from "react";
import { useSelector } from "react-redux";

import { Selection } from "../Selection";

import { annotationStateSelector, toolTypeSelector } from "store/selectors";

import { AnnotationStateType } from "types/AnnotationStateType";
import { ToolType } from "types/ToolType";

import { Tool } from "annotator/image/Tool";

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
