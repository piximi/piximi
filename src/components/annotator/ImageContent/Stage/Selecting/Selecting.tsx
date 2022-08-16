import React from "react";
import { useSelector } from "react-redux";

import { Selection } from "../Selection";

import { Tool } from "annotator/image/Tool";

import { annotationStateSelector, toolTypeSelector } from "store/image-viewer";

import { AnnotationStateType, ToolType } from "types";

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
