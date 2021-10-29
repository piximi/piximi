import * as ReactKonva from "react-konva";
import React, { useEffect, useState } from "react";
import {
  annotatingSelector,
  stageScaleSelector,
  toolTypeSelector,
} from "../../../../../annotator/store/selectors";
import { useSelector } from "react-redux";
import { ToolType } from "../../../../../annotator/types/ToolType";
import { annotatedSelector } from "../../../../../annotator/store/selectors/annotatedSelector";

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

  const annotated = useSelector(annotatedSelector);
  const annotating = useSelector(annotatingSelector);

  useEffect(() => {
    if (!toolTipPosition) return;
    setText(`Tolerance: ${tolerance}`);
  }, [toolTipPosition]);

  if (toolType !== ToolType.ColorAnnotation) return <></>;

  if (!annotating || annotated || !toolTipPosition || !initialPosition) {
    return <></>;
  }

  return (
    <>
      {/*// @ts-ignore */}
      <ReactKonva.Group>
        {/*// @ts-ignore */}
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
        {/*// @ts-ignore */}
        <ReactKonva.Label
          position={{
            x: toolTipPosition.x * stageScale,
            y: toolTipPosition.y * stageScale,
          }}
          opacity={0.75}
        >
          {/*// @ts-ignore */}
          <ReactKonva.Tag fill={"black"} />
          {/*// @ts-ignore */}
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
