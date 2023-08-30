import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";

import { StageContext } from "views/AnnotatorView/AnnotatorView";
import { PenAnnotationToolTip } from "components/stage/Stage/PenAnnotationToolTip";

import { cursorSelector } from "store/imageViewer";

import { AnnotationStateType, Point, ToolType } from "types";

type CursorProps = {
  positionByStage: Point | undefined;
  absolutePosition: Point | undefined;
  annotationState: AnnotationStateType;
  outOfBounds: boolean;
  draggable: boolean;
  toolType: ToolType;
};

export const Cursor = ({
  positionByStage,
  absolutePosition,
  annotationState,
  outOfBounds,
  draggable,
  toolType,
}: CursorProps) => {
  const stageRef = useContext(StageContext);
  const cursor = useSelector(cursorSelector);
  useEffect(() => {
    if (!stageRef || !stageRef.current) return;

    if (draggable) {
      stageRef.current.container().style.cursor = "grab";
    } else {
      if (outOfBounds) {
        stageRef.current.container().style.cursor = "not-allowed";
      } else {
        stageRef.current.container().style.cursor = cursor;
      }
    }
  }, [draggable, outOfBounds, cursor, stageRef]);
  return toolType === ToolType.PenAnnotation && !outOfBounds ? (
    <PenAnnotationToolTip
      currentPosition={positionByStage}
      absolutePosition={absolutePosition}
      annotating={annotationState === AnnotationStateType.Annotating}
      outOfBounds={outOfBounds}
    />
  ) : (
    <></>
  );
};
