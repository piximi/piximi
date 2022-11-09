import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import {
  annotationStateSelector,
  stageScaleSelector,
  toolTypeSelector,
} from "store/annotator";

import { AnnotationStateType, ToolType } from "types";

type ColorAnnotationToolTipProps = {
  toolTipPosition?: { x: number; y: number };
  initialPosition?: { x: number; y: number };
  tolerance: number;
};

export const ColorAnnotationToolTip = ({
  toolTipPosition,
  initialPosition,
  tolerance,
}: ColorAnnotationToolTipProps) => {
  const [text, setText] = useState<string>("Tolerance: 0%");
  const toolType = useSelector(toolTypeSelector);

  const stageScale = useSelector(stageScaleSelector);

  const annotationState = useSelector(annotationStateSelector);

  useEffect(() => {
    if (!toolTipPosition) return;
    setText(`Tolerance: ${tolerance}`);
  }, [toolTipPosition, tolerance]);

  if (toolType !== ToolType.ColorAnnotation) return <></>;

  if (
    annotationState !== AnnotationStateType.Annotating ||
    !toolTipPosition ||
    !initialPosition
  ) {
    return <React.Fragment />;
  }

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Line
          points={[
            toolTipPosition.x,
            toolTipPosition.y!,
            initialPosition.x,
            initialPosition.y,
          ]}
          scale={{ x: stageScale, y: stageScale }}
          strokeWidth={1}
          stroke="white"
        />
        <ReactKonva.Label
          position={{
            x: toolTipPosition.x * stageScale,
            y: toolTipPosition.y * stageScale,
          }}
          opacity={0.75}
        >
          <ReactKonva.Tag fill={"black"} />
          <ReactKonva.Text
            fill={"white"}
            fontSize={12}
            padding={5}
            text={text}
          />
        </ReactKonva.Label>
      </ReactKonva.Group>
    </>
  );
};
