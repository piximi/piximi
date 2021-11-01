import * as ReactKonva from "react-konva";
import React from "react";
import { MagneticAnnotationTool } from "../../../../../../annotator/image/Tool";
import { useMarchingAnts } from "../../../../../../hooks";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "../../../../../../store/selectors";

type MagneticSelectionProps = {
  operator: MagneticAnnotationTool;
};

export const MagneticSelection = ({ operator }: MagneticSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const stageScale = useSelector(stageScaleSelector);

  if (!operator.origin) return <></>;

  return (
    <>
      {/*// @ts-ignore */}
      <ReactKonva.Group>
        {/*// @ts-ignore */}
        <ReactKonva.Circle
          fill="white"
          radius={3}
          stroke="black"
          strokeWidth={1}
          x={operator.origin.x * stageScale}
          y={operator.origin.y * stageScale}
        />
        {operator.anchor && (
          <>
            {/*// @ts-ignore */}
            <ReactKonva.Circle
              fill="black"
              radius={3}
              stroke="white"
              strokeWidth={1}
              x={operator.anchor.x * stageScale}
              y={operator.anchor.y * stageScale}
            />
          </>
        )}
        {/*// @ts-ignore */}
        <ReactKonva.Line
          points={operator.buffer}
          scale={{ x: stageScale, y: stageScale }}
          stroke="black"
          strokeWidth={1 / stageScale}
        />
        {/*// @ts-ignore */}
        <ReactKonva.Line
          dash={[4 / stageScale, 2 / stageScale]}
          scale={{ x: stageScale, y: stageScale }}
          dashOffset={-dashOffset}
          stroke="white"
          points={operator.buffer}
          strokeWidth={1 / stageScale}
        />
      </ReactKonva.Group>
    </>
  );
};
