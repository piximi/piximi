import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";

import { selectSoundEnabled } from "store/application";
import {
  activeImageIdSelector,
  cursorSelector,
  setSelectedAnnotationIds,
  stageScaleSelector,
  imageOriginSelector,
  selectActiveAnnotationIds,
} from "store/imageViewer";

import { annotatorSlice } from "store/annotator";

import {
  selectActiveImageHeight,
  selectActiveImageWidth,
  selectWorkingAnnotation,
  selectSelectedAnnotations,
} from "store/data";

import useSound from "use-sound";

import { AnnotationModeType, AnnotationStateType } from "types";

import { AnnotationTool } from "annotator-tools";
import createAnnotationSoundEffect from "data/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "data/sounds/pop-up-off.mp3";

type box = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type AnnotationTransformerProps = {
  transformPosition: ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => { x: number; y: number } | undefined;
  annotationId: string;
  annotationTool?: AnnotationTool;
};

export const AnnotationTransformer = ({
  transformPosition,
  annotationId,
  annotationTool,
}: AnnotationTransformerProps) => {
  const [transforming, setTransforming] = useState<boolean>(false);
  const [transformed, setTransformed] = useState<boolean>(false);
  const activeAnnotationIds = useSelector(selectActiveAnnotationIds);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const activeImageId = useSelector(activeImageIdSelector);
  const stageScale = useSelector(stageScaleSelector);
  const cursor = useSelector(cursorSelector);
  const soundEnabled = useSelector(selectSoundEnabled);
  const imageWidth = useSelector(selectActiveImageWidth);
  const imageHeight = useSelector(selectActiveImageHeight);
  const imageOrigin = useSelector(imageOriginSelector);
  const trRef = useRef<Konva.Transformer | null>(null);
  const [xPos, setXPos] = useState<number>(0);
  const [yPos, setYPos] = useState<number>(0);

  const dispatch = useDispatch();

  const [playCreateAnnotationSoundEffect] = useSound(
    createAnnotationSoundEffect
  );
  const [playDeleteAnnotationSoundEffect] = useSound(
    deleteAnnotationSoundEffect
  );

  /**
   * Obtain box coordinates in image space
   * @param boundBox -
   * @returns {box}
   */
  const getRelativeBox = (
    boundBox: box,
    scaleFactor: number
  ): box | undefined => {
    const relativePosition = transformPosition({
      x: boundBox.x,
      y: boundBox.y,
    });
    if (!relativePosition) return;
    return {
      x: relativePosition.x / scaleFactor,
      y: relativePosition.y / scaleFactor,
      height: boundBox.height / scaleFactor,
      width: boundBox.width / scaleFactor,
      rotation: 0,
    };
  };

  const onTransformStart = () => {
    setTransforming(true);
    const selected = activeAnnotationIds.find((id: string) => {
      return id === annotationId;
    });

    if (!selected) return;

    if (!transformed) {
      dispatch(
        setSelectedAnnotationIds({
          annotationIds: [selected],
          workingAnnotationId: selected,
        })
      );
    }
  };

  const boundingBoxFunc = (oldBox: box, newBox: box) => {
    const relativeNewBox = getRelativeBox(newBox, stageScale);

    if (!imageWidth || !imageHeight || !relativeNewBox) return oldBox;

    const minimumBoxDim = 5;

    if (
      relativeNewBox.width < minimumBoxDim ||
      relativeNewBox.height < minimumBoxDim
    )
      return oldBox;

    if (
      Math.floor(relativeNewBox.x + relativeNewBox.width) > imageWidth ||
      Math.floor(relativeNewBox.y + relativeNewBox.height) > imageHeight ||
      relativeNewBox.x < 0 ||
      relativeNewBox.y < 0
    ) {
      return oldBox;
    }
    if (!transformed) {
      setTransformed(true);
    }
    return newBox;
  };

  const cancelAnnotation = () => {
    if (annotationTool) {
      annotationTool.deselect();
    } else {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool: annotationTool,
        })
      );
    }

    dispatch(
      annotatorSlice.actions.setSelectionMode({
        selectionMode: AnnotationModeType.New,
      })
    );

    dispatch(
      setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );

    setTransformed(false);
  };

  const confirmAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;

    if (!activeImageId) return;

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    cancelAnnotation();
    if (soundEnabled) playCreateAnnotationSoundEffect();
  };

  const cancelAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;

    cancelAnnotation();
    if (soundEnabled) playDeleteAnnotationSoundEffect();
  };

  const onMouseEnter = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = "pointer";
  };

  const onMouseLeave = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;
  };

  const deleteAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;

    if (!activeImageId) return;

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    cancelAnnotation();

    if (soundEnabled) playCreateAnnotationSoundEffect();
  };

  useEffect(() => {
    if (workingAnnotation && selectedAnnotations.length === 1) {
      setXPos(
        Math.max(
          workingAnnotation.boundingBox[0],
          workingAnnotation.boundingBox[2]
        ) *
          stageScale +
          imageOrigin.x
      );

      const tempYPos = Math.max(
        workingAnnotation.boundingBox[1],
        workingAnnotation.boundingBox[3]
      );
      setYPos(
        (tempYPos + 56) * stageScale > imageHeight!
          ? (imageHeight! - 65) * stageScale + imageOrigin.y
          : tempYPos * stageScale + imageOrigin.y
      );
    }
  }, [
    workingAnnotation,
    selectedAnnotations.length,
    imageHeight,
    imageOrigin,
    stageScale,
  ]);

  useEffect(() => {
    if (!activeAnnotationIds.includes(annotationId)) {
      setTransformed(true);
    }
  }, [activeAnnotationIds, annotationId]);

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Transformer
          boundBoxFunc={boundingBoxFunc}
          onTransformStart={onTransformStart}
          onTransformEnd={() => {
            setTransforming(false);
          }}
          id={"tr-".concat(annotationId)}
          ref={trRef}
          rotateEnabled={false}
        />
        {workingAnnotation &&
          selectedAnnotations.length === 1 &&
          !transforming && (
            <>
              <ReactKonva.Group
                id={"label-group"}
                position={{ x: xPos, y: yPos }}
                scaleX={1 / stageScale}
                scaleY={1 / stageScale}
              >
                <ReactKonva.Label
                  position={{
                    x: -58,
                    y: 6,
                  }}
                  onClick={
                    transformed
                      ? confirmAnnotationHandler
                      : deleteAnnotationHandler
                  }
                  onTap={
                    transformed
                      ? confirmAnnotationHandler
                      : deleteAnnotationHandler
                  }
                  id={"label"}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  <ReactKonva.Tag
                    cornerRadius={3}
                    fill={"darkgreen"}
                    lineJoin={"round"}
                    shadowColor={"black"}
                    shadowBlur={10}
                    shadowOffset={{ x: 5, y: 5 }}
                  />
                  <ReactKonva.Text
                    fill={"white"}
                    fontSize={14}
                    padding={6}
                    text={transformed ? "Confirm" : "Delete"}
                    width={65}
                    height={26}
                    align={"center"}
                    name={"transformer-button"}
                  />
                </ReactKonva.Label>
                <ReactKonva.Label
                  position={{
                    x: -58,
                    y: 35,
                  }}
                  onClick={cancelAnnotationHandler}
                  onTap={cancelAnnotationHandler}
                  id={"label"}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                >
                  <ReactKonva.Tag
                    cornerRadius={3}
                    fill={"darkred"}
                    lineJoin={"round"}
                    shadowColor={"black"}
                    shadowBlur={10}
                    shadowOffset={{ x: 5, y: 5 }}
                  />
                  <ReactKonva.Text
                    fill={"white"}
                    fontSize={14}
                    padding={6}
                    text={"Cancel"}
                    width={65}
                    height={26}
                    align={"center"}
                    name={"transformer-button"}
                  />
                </ReactKonva.Label>
              </ReactKonva.Group>
            </>
          )}
      </ReactKonva.Group>
    </>
  );
};
