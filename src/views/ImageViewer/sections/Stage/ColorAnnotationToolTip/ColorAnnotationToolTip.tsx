import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { StageContext } from "views/ImageViewer/state/StageContext";
import {
  selectAnnotationState,
  selectToolType,
} from "views/ImageViewer/state/annotator/selectors";

import { AnnotationState, ToolType } from "utils/annotator/enums";

type ColorAnnotationToolTipProps = {
  toolTipPosition?: { x: number; y: number };
  initialPosition?: { x: number; y: number };
  imageOrigin?: { x: number; y: number };
  tolerance: number;
};

export const ColorAnnotationToolTip = ({
  toolTipPosition,
  initialPosition,
  imageOrigin,
  tolerance,
}: ColorAnnotationToolTipProps) => {
  const [text, setText] = useState<string>("Tolerance: 0%");
  const toolType = useSelector(selectToolType);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;
  const annotationState = useSelector(selectAnnotationState);

  useEffect(() => {
    if (!toolTipPosition) return;
    setText(`Tolerance: ${tolerance} `);
  }, [toolTipPosition, tolerance]);

  if (toolType !== ToolType.ColorAnnotation) return <></>;

  if (
    annotationState !== AnnotationState.Annotating ||
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
            toolTipPosition.y,
            initialPosition.x + imageOrigin!.x,
            initialPosition.y + imageOrigin!.y,
          ]}
          strokeWidth={1 / stageScale}
          stroke="white"
        />
        <ReactKonva.Label
          position={{
            x: toolTipPosition.x, //+ imageOrigin!.x,
            y: toolTipPosition.y, //+ imageOrigin!.y,
          }}
          opacity={0.75}
        >
          <ReactKonva.Tag fill={"black"} />
          <ReactKonva.Text
            fill={"white"}
            fontSize={12 / stageScale}
            padding={5 / stageScale}
            text={text}
          />
        </ReactKonva.Label>
      </ReactKonva.Group>
    </>
  );
};
