import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";

import { PenAnnotationToolTip } from "../PenAnnotationToolTip";

import { StageContext } from "contexts";
import { selectCursor } from "store/imageViewer/selectors";

import { Point } from "utils/annotator/types";
import { AnnotationState, ToolType } from "utils/annotator/enums";

type CursorProps = {
  positionByStage: Point | undefined;
  absolutePosition: Point | undefined;
  annotationState: AnnotationState;
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
  const cursor = useSelector(selectCursor);
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
      annotating={annotationState === AnnotationState.Annotating}
      outOfBounds={outOfBounds}
    />
  ) : (
    <></>
  );
};
