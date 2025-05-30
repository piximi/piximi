import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Group as KonvaGroup,
  Label as KonvaLabel,
  Line as KonvaLine,
  Tag as KonvaTag,
  Text as KonvaText,
} from "react-konva";

import { StageContext } from "views/ImageViewer/state/StageContext";
import {
  selectAnnotationState,
  selectToolType,
} from "views/ImageViewer/state/annotator/selectors";

import { AnnotationState, ToolType } from "views/ImageViewer/utils/enums";

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
      <KonvaGroup>
        <KonvaLine
          points={[
            toolTipPosition.x,
            toolTipPosition.y,
            initialPosition.x + imageOrigin!.x,
            initialPosition.y + imageOrigin!.y,
          ]}
          strokeWidth={1 / stageScale}
          stroke="white"
        />
        <KonvaLabel
          position={{
            x: toolTipPosition.x, //+ imageOrigin!.x,
            y: toolTipPosition.y, //+ imageOrigin!.y,
          }}
          opacity={0.75}
        >
          <KonvaTag fill={"black"} />
          <KonvaText
            fill={"white"}
            fontSize={12 / stageScale}
            padding={5 / stageScale}
            text={text}
          />
        </KonvaLabel>
      </KonvaGroup>
    </>
  );
};
