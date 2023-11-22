import { useContext, useLayoutEffect, useRef, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";

import { StageContext } from "views/ImageViewer/ImageViewer";
import { selectSoundEnabled } from "store/slices/applicationSettings";
import {
  selectActiveImageId,
  selectCursor,
  setSelectedAnnotationIds,
  selectImageOrigin,
  selectActiveAnnotationIds,
  selectWorkingAnnotation,
  imageViewerSlice,
} from "store/slices/imageViewer";

import { annotatorSlice } from "store/slices/annotator";

import {
  dataSlice,
  selectActiveImageHeight,
  selectSelectedAnnotations,
} from "store/slices/data";

import useSound from "use-sound";

import { AnnotationModeType } from "types";

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

type AnnotationTransformerProps = {
  annotationId: string;
  annotationTool: AnnotationTool;
};

export const AnnotationTransformer = ({
  annotationId,
  annotationTool,
}: AnnotationTransformerProps) => {
  const stageRef = useContext(StageContext);

  const [xPos, setXPos] = useState<number>(0);
  const [yPos, setYPos] = useState<number>(0);

  const activeAnnotationIds = useSelector(selectActiveAnnotationIds);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const activeImageId = useSelector(selectActiveImageId);
  const cursor = useSelector(selectCursor);
  const soundEnabled = useSelector(selectSoundEnabled);
  const imageHeight = useSelector(selectActiveImageHeight);
  const imageOrigin = useSelector(selectImageOrigin);

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

  const clearAnnotation = () => {
    annotationTool.deselect();
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({ annotation: undefined })
      );
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
    });
  };

  const handleConfirmOrDeleteAnnotation = (
    event: Konva.KonvaEventObject<Event>
  ) => {
    if (!activeImageId) return;
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    if (activeAnnotationIds.includes(annotationId)) {
      if (Object.keys(workingAnnotation.changes).length === 0) {
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({
            annotationIds: [annotationId],
          })
        );
        dispatch(
          dataSlice.actions.deleteAnnotations({ annotationIds: [annotationId] })
        );
      } else {
        dispatch(
          dataSlice.actions.updateAnnotations({
            updates: [{ id: annotationId, ...workingAnnotation.changes }],
          })
        );
      }
      if (soundEnabled) playDeleteAnnotationSoundEffect();
    } else {
      dispatch(
        dataSlice.actions.addAnnotations({
          annotations: [
            {
              ...workingAnnotation.saved!,
              ...workingAnnotation.changes,
            },
          ],
        })
      );
      if (soundEnabled) playCreateAnnotationSoundEffect();
    }
    clearAnnotation();
  };

  const cancelAnnotationHandler = (event: Konva.KonvaEventObject<Event>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;
    clearAnnotation();
    if (soundEnabled) playDeleteAnnotationSoundEffect();
  };

  const handleMouseEnter = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = "pointer";
  };

  const handleMouseLeave = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;
  };

  useLayoutEffect(() => {
    if (workingAnnotation.saved) {
      const fullWorkingAnnotation = {
        ...workingAnnotation.saved,
        ...workingAnnotation.changes,
      };
      const newX =
        Math.max(
          fullWorkingAnnotation.boundingBox[0],
          fullWorkingAnnotation.boundingBox[2]
        ) + imageOrigin.x;
      setXPos(newX);

      const yMax = Math.max(
        fullWorkingAnnotation.boundingBox[1],
        fullWorkingAnnotation.boundingBox[3]
      );
      const newY =
        yMax + 56 > imageHeight!
          ? imageHeight! - 65 + imageOrigin.y
          : yMax + imageOrigin.y;
      setYPos(newY);
    }
  }, [
    workingAnnotation,
    selectedAnnotations.length,
    imageHeight,
    imageOrigin,
    stageRef,
  ]);

  useLayoutEffect(() => {
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

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Transformer
          id={"tr-".concat(annotationId)}
          ref={trRef}
          rotateEnabled={false}
          resizeEnabled={false}
          borderStrokeWidth={1}
          borderStroke="white" //TODO: It would be pretty cool if the border color could set depending on the primary color of the underlying image for contrast
        />
        {workingAnnotation && (
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
                onClick={handleConfirmOrDeleteAnnotation}
                onTap={handleConfirmOrDeleteAnnotation}
                id={"label"}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
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
                  text={
                    activeAnnotationIds.includes(annotationId) &&
                    Object.keys(workingAnnotation.changes).length === 0
                      ? "Delete"
                      : "Confirm"
                  }
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
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
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
