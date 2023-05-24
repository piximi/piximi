import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";

import { StageContext } from "components/annotator/AnnotatorView/AnnotatorView";
import { selectSoundEnabled } from "store/application";
import {
  activeImageIdSelector,
  cursorSelector,
  setSelectedAnnotationIds,
  imageOriginSelector,
  selectActiveAnnotationIds,
  selectWorkingAnnotation,
  imageViewerSlice,
} from "store/imageViewer";

import { annotatorSlice } from "store/annotator";

import {
  dataSlice,
  selectActiveImageHeight,
  selectActiveImageWidth,
  selectSelectedAnnotations,
} from "store/data";

import useSound from "use-sound";

import { AnnotationModeType, AnnotationStateType } from "types";

import { AnnotationTool } from "annotator-tools";
import createAnnotationSoundEffect from "data/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "data/sounds/pop-up-off.mp3";

const buttonWidth = 65;
const buttonHeight = 26;
const buttonGap = 6;
const labelPosition = {
  x: -buttonWidth,
  y1: buttonGap,
  y2: buttonHeight + buttonGap * 2,
};
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
  const stageRef = useContext(StageContext);

  const [transforming, setTransforming] = useState<boolean>(false);
  const [transformed, setTransformed] = useState<boolean>(false);
  const [xPos, setXPos] = useState<number>(0);
  const [yPos, setYPos] = useState<number>(0);

  const activeAnnotationIds = useSelector(selectActiveAnnotationIds);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const activeImageId = useSelector(activeImageIdSelector);
  const cursor = useSelector(cursorSelector);
  const soundEnabled = useSelector(selectSoundEnabled);
  const imageWidth = useSelector(selectActiveImageWidth);
  const imageHeight = useSelector(selectActiveImageHeight);
  const imageOrigin = useSelector(imageOriginSelector);

  const trRef = useRef<Konva.Transformer | null>(null);
  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();
  const labelGroupRef = useRef<Konva.Group>();

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
    const stageScale = stageRef?.current?.scaleX() ?? 1;
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
    if (!activeImageId) return;
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    dispatch(
      dataSlice.actions.addAnnotation({ annotation: workingAnnotation! })
    );
    dispatch(
      imageViewerSlice.actions.setWorkingAnnotation({ annotation: undefined })
    );

    cancelAnnotation();
    if (soundEnabled) playCreateAnnotationSoundEffect();
  };

  const cancelAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;

    cancelAnnotation();
    if (soundEnabled) playDeleteAnnotationSoundEffect();
  };

  const onMouseEnter = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = "pointer";
  };

  const onMouseLeave = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;
  };

  const deleteAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;

    if (!activeImageId) return;

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    cancelAnnotation();

    if (soundEnabled) playCreateAnnotationSoundEffect();
  };

  useEffect(() => {
    if (workingAnnotation) {
      const newX =
        Math.max(
          workingAnnotation.boundingBox[0],
          workingAnnotation.boundingBox[2]
        ) + imageOrigin.x;
      setXPos(newX);

      const yMax = Math.max(
        workingAnnotation.boundingBox[1],
        workingAnnotation.boundingBox[3]
      );
      const newY =
        yMax + 56 > imageHeight!
          ? imageHeight! - 65 + imageOrigin.y
          : yMax + imageOrigin.y;
      setYPos(newY);
    }
  }, [workingAnnotation, selectedAnnotations.length, imageHeight, imageOrigin]);

  useEffect(() => {
    if (!activeAnnotationIds.includes(annotationId)) {
      setTransformed(true);
    }
  }, [activeAnnotationIds, annotationId]);

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    const transformerId = "tr-".concat(annotationId);
    const transformer: Konva.Transformer | undefined = stageRef.current.findOne(
      `#${transformerId}`
    ) as Konva.Transformer;
    const line = stageRef.current.findOne(`#${annotationId}`);
    if (!line || !transformer) return;
    transformer.nodes([line]);
    const layer = transformer.getLayer();
    if (layer) {
      layer.batchDraw();
      // Not ideal but this figures out which label is which
      const label = stageRef.current.find(`#label`);
      if (label.length > 1) {
        saveLabelRef.current = label[0] as Konva.Label;
        clearLabelRef.current = label[1] as Konva.Label;
      }
      const group = stageRef.current.find("#label-group");
      labelGroupRef.current = group[0] as Konva.Group;
    }
    return () => {
      transformer.detach();
      transformer.getLayer()?.batchDraw();
    };
  }, [annotationId, stageRef]);

  useEffect(() => {
    console.log(workingAnnotation && transforming);
  });

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
        {workingAnnotation && !transforming && (
          <>
            <ReactKonva.Group
              id={"label-group"}
              position={{ x: xPos, y: yPos }}
              scaleX={1 / (stageRef?.current?.scaleX() ?? 1)}
              scaleY={1 / (stageRef?.current?.scaleX() ?? 1)}
            >
              <ReactKonva.Label
                position={{
                  x: labelPosition.x,
                  y: labelPosition.y1,
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
                  width={buttonWidth}
                  height={buttonHeight}
                  align={"center"}
                  name={"transformer-button"}
                />
              </ReactKonva.Label>
              <ReactKonva.Label
                position={{
                  x: labelPosition.x,
                  y: labelPosition.y2,
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
                  width={buttonWidth}
                  height={buttonHeight}
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
