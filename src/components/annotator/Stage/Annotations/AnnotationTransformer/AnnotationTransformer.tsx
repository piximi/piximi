import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";

import {
  imageWidthSelector,
  workingAnnotationSelector,
  selectedAnnotationsSelector,
  soundEnabledSelector,
  activeImageIdSelector,
  cursorSelector,
  imageHeightSelector,
  setSelectedAnnotations,
  stagedAnnotationsSelector,
  stageScaleSelector,
  setAnnotationState,
  setSelectionMode,
  setStagedAnnotations,
  updateStagedAnnotations,
} from "store/annotator";

import useSound from "use-sound";

import {
  AnnotationModeType,
  AnnotationStateType,
  decodedAnnotationType,
} from "types";

import { AnnotationTool } from "annotator-tools";
import createAnnotationSoundEffect from "data/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "data/sounds/pop-up-off.mp3";
import { useImageOrigin } from "hooks";

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
  const stagedAnnotations = useSelector(stagedAnnotationsSelector);
  const workingAnnotation = useSelector(workingAnnotationSelector);
  const selectedAnnotations = useSelector(selectedAnnotationsSelector);
  const activeImageId = useSelector(activeImageIdSelector);
  const stageScale = useSelector(stageScaleSelector);
  const cursor = useSelector(cursorSelector);
  const soundEnabled = useSelector(soundEnabledSelector);
  const imageWidth = useSelector(imageWidthSelector);
  const imageHeight = useSelector(imageHeightSelector);
  const trRef = useRef<Konva.Transformer | null>(null);

  const dispatch = useDispatch();

  const [playCreateAnnotationSoundEffect] = useSound(
    createAnnotationSoundEffect
  );
  const [playDeleteAnnotationSoundEffect] = useSound(
    deleteAnnotationSoundEffect
  );

  const imageOrigin = useImageOrigin();

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
    const selected = stagedAnnotations.find(
      (annotation: decodedAnnotationType) => {
        return annotation.id === annotationId;
      }
    );

    if (!selected) return;

    if (!transformed) {
      dispatch(
        setSelectedAnnotations({
          selectedAnnotations: [selected],
          workingAnnotation: selected,
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
        setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool: annotationTool,
          execSaga: true,
        })
      );
    }

    dispatch(
      setSelectionMode({
        selectionMode: AnnotationModeType.New,
      })
    );

    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [],
        workingAnnotation: undefined,
      })
    );

    setTransformed(false);
  };

  const confirmAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;

    if (!activeImageId) return;

    dispatch(updateStagedAnnotations({}));

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

    dispatch(updateStagedAnnotations({}));

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    cancelAnnotation();
    dispatch(
      setStagedAnnotations({
        annotations: stagedAnnotations.filter(
          (annotation) => annotation.id !== annotationId
        ),
      })
    );
    if (soundEnabled) playCreateAnnotationSoundEffect();
  };

  let posX = 0;
  let posY = 0;

  if (workingAnnotation && selectedAnnotations.length === 1) {
    posX =
      Math.max(
        workingAnnotation.boundingBox[0],
        workingAnnotation.boundingBox[2]
      ) + imageOrigin.x;

    posY = Math.max(
      workingAnnotation.boundingBox[1],
      workingAnnotation.boundingBox[3]
    );
    posY =
      posY + 56 > imageHeight!
        ? imageHeight! - 65 + imageOrigin.y
        : posY + imageOrigin.y;
  }

  useEffect(() => {
    if (
      !stagedAnnotations
        .map((annotation) => annotation.id)
        .includes(annotationId)
    ) {
      setTransformed(true);
    }
  }, [stagedAnnotations, annotationId]);

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
                position={{ x: posX, y: posY }}
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
