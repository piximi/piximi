import React from "react";
import { useSelector } from "react-redux";

import { Selection } from "../Selection";

import { Tool } from "annotator/Tool";

import { annotationStateSelector, toolTypeSelector } from "store/image-viewer";

import { AnnotationStateType, ToolType } from "types";

type SelectingProps = {
  tool: Tool;
};

export const Selecting = ({ tool }: SelectingProps) => {
  const toolType = useSelector(toolTypeSelector);

  return <Selection tool={tool} toolType={toolType} />;
};
