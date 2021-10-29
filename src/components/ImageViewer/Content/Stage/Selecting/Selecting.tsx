import React from "react";
import { Selection } from "../Selection";
import { useSelector } from "react-redux";
import { annotatedSelector } from "../../../../../annotator/store/selectors/annotatedSelector";
import {
  annotatingSelector,
  toolTypeSelector,
} from "../../../../../annotator/store/selectors";
import { Tool } from "../../../../../annotator/image/Tool";
import { ToolType } from "../../../../../annotator/types/ToolType";

type SelectingProps = {
  tool: Tool;
};

export const Selecting = ({ tool }: SelectingProps) => {
  const annotated = useSelector(annotatedSelector);

  const annotating = useSelector(annotatingSelector);

  const toolType = useSelector(toolTypeSelector);

  if ((annotated || !annotating) && toolType !== ToolType.QuickAnnotation)
    return <></>;

  return (
    <>
      <Selection tool={tool} toolType={toolType} />
    </>
  );
};
