import { useContext, useLayoutEffect, useRef, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import {
  Group as KonvaGroup,
  Label as KonvaLabel,
  Tag as KonvaTag,
  Text as KonvaText,
  Transformer as KonvaTransformer,
} from "react-konva";
import useSound from "use-sound";

import { useHotkeys } from "hooks";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectCursor,
  selectImageOrigin,
} from "views/ImageViewer/state/imageViewer/selectors";
import { selectSoundEnabled } from "store/applicationSettings/selectors";
import { selectWorkingAnnotationEntity } from "views/ImageViewer/state/annotator/selectors";
import { selectSelectedAnnotations } from "views/ImageViewer/state/annotator/reselectors";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";

import { AnnotationTool } from "views/ImageViewer/utils/tools";

import { getCompleteEntity } from "views/ImageViewer/state/annotator/utils";

import { AnnotationMode } from "views/ImageViewer/utils/enums";
import { HotkeyContext } from "utils/enums";

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
  hasControl?: boolean;
};

export const AnnotationTransformer = ({
  annotationId,
  annotationTool,
  hasControl,
}: AnnotationTransformerProps) => {
  const stageRef = useContext(StageContext);

  const [xPos, setXPos] = useState<number>(0);
  const [yPos, setYPos] = useState<number>(0);

  const activeImage = useSelector(selectActiveImage)!;
  const workingAnnotation = useSelector(selectWorkingAnnotationEntity);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const cursor = useSelector(selectCursor);
  const soundEnabled = useSelector(selectSoundEnabled);
  const imageOrigin = useSelector(selectImageOrigin);

  const trRef = useRef<Konva.Transformer | null>(null);
  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();
  const labelGroupRef = useRef<Konva.Group>();

  const dispatch = useDispatch();

  const [playCreateAnnotationSoundEffect] = useSound(
    createAnnotationSoundEffect,
  );
  const [playDeleteAnnotationSoundEffect] = useSound(
    deleteAnnotationSoundEffect,
  );

  const clearAnnotation = () => {
    annotationTool.deselect();
    batch(() => {
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: undefined,
        }),
      );
      dispatch(
        annotatorSlice.actions.setAnnotationMode({
          annotationMode: AnnotationMode.New,
        }),
      );

      dispatch(
        annotatorSlice.actions.setSelectedAnnotationIds({
          annotationIds: [],
          workingAnnotationId: undefined,
        }),
      );
    });
  };

  const handleConfirmOrDeleteAnnotation = (
    _event?: Konva.KonvaEventObject<Event>,
  ) => {
    if (!activeImage) return;
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;

    trRef.current!.detach();
    trRef.current!.getLayer()?.batchDraw();

    if (activeImage.containing.includes(annotationId)) {
      if (Object.keys(workingAnnotation.changes).length === 0) {
        dispatch(
          annotatorSlice.actions.deleteThings({
            things: selectedAnnotations,
          }),
        );
      } else {
        dispatch(
          annotatorSlice.actions.editThings({
            updates: [{ id: annotationId, ...workingAnnotation.changes }],
          }),
        );
      }
      if (soundEnabled) playDeleteAnnotationSoundEffect();
    } else {
      const completeWorkingAnnotation = getCompleteEntity(workingAnnotation)!;
      dispatch(
        annotatorSlice.actions.addThing({
          thing: completeWorkingAnnotation,
        }),
      );
      if (soundEnabled) playCreateAnnotationSoundEffect();
    }
    clearAnnotation();
  };

  const cancelAnnotationHandler = (_event?: Konva.KonvaEventObject<Event>) => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;
    clearAnnotation();
    if (soundEnabled) playDeleteAnnotationSoundEffect();
  };

  const handleMouseEnter = () => {
    const container = stageRef!.current!.container();
    container.style.cursor = "pointer";
  };

  const handleMouseLeave = () => {
    const container = stageRef!.current!.container();
    container.style.cursor = cursor;
  };

  useLayoutEffect(() => {
    if (activeImage) {
      const imageHeight = activeImage.shape.height;
      if (workingAnnotation.saved) {
        const fullWorkingAnnotation = {
          ...workingAnnotation.saved,
          ...workingAnnotation.changes,
        };

        const newX =
          Math.max(
            fullWorkingAnnotation.boundingBox[0],
            fullWorkingAnnotation.boundingBox[2],
          ) + imageOrigin.x;
        setXPos(newX);

        const yMax = Math.max(
          fullWorkingAnnotation.boundingBox[1],
          fullWorkingAnnotation.boundingBox[3],
        );
        const newY =
          yMax + 56 > imageHeight!
            ? imageHeight! - 65 + imageOrigin.y
            : yMax + imageOrigin.y;
        setYPos(newY);
      }
    }
  }, [
    workingAnnotation,
    selectedAnnotations.length,
    activeImage,
    imageOrigin,
    stageRef,
  ]);

  useLayoutEffect(() => {
    if (!stageRef || !stageRef.current) return;
    const transformerId = "tr-".concat(annotationId);
    const transformer: Konva.Transformer | undefined = stageRef.current.findOne(
      `#${transformerId}`,
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

  useHotkeys(
    "enter",
    (event) => {
      if (!event.repeat) {
        if (workingAnnotation.saved?.id === annotationId) {
          handleConfirmOrDeleteAnnotation();
        }
      }
    },
    HotkeyContext.AnnotatorView,
    [workingAnnotation.saved],
  );
  useHotkeys(
    "esc",
    (event) => {
      if (!event.repeat) {
        if (workingAnnotation.saved?.id === annotationId) {
          cancelAnnotationHandler();
        }
      }
    },
    HotkeyContext.AnnotatorView,
    [workingAnnotation.saved],
  );

  return (
    <KonvaGroup>
      <KonvaTransformer
        id={"tr-".concat(annotationId)}
        ref={trRef}
        rotateEnabled={false}
        resizeEnabled={false}
        borderStrokeWidth={1}
        borderStroke="white" //TODO: It would be pretty cool if the border color could set depending on the primary color of the underlying image for contrast
      />
      {hasControl && (
        <KonvaGroup
          id={"label-group"}
          position={{ x: xPos, y: yPos }}
          scaleX={1 / (stageRef?.current?.scaleX() ?? 1)}
          scaleY={1 / (stageRef?.current?.scaleX() ?? 1)}
        >
          <KonvaButton
            xPosition={labelPosition.x}
            yPosition={labelPosition.y1}
            handleConfirmOrDeleteAnnotation={handleConfirmOrDeleteAnnotation}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            text={
              activeImage.containing.includes(annotationId) &&
              Object.keys(workingAnnotation.changes).length === 0
                ? "Delete"
                : "Confirm"
            }
            fillColor={"darkgreen"}
          />
          <KonvaButton
            xPosition={labelPosition.x}
            yPosition={labelPosition.y2}
            handleConfirmOrDeleteAnnotation={cancelAnnotationHandler}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
            text={"Cancel"}
            fillColor={"darkred"}
          />
        </KonvaGroup>
      )}
    </KonvaGroup>
  );
};

const KonvaButton = ({
  xPosition,
  yPosition,
  handleConfirmOrDeleteAnnotation,
  handleMouseEnter,
  handleMouseLeave,
  text,
  fillColor,
}: {
  xPosition: number;
  yPosition: number;
  handleConfirmOrDeleteAnnotation: () => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  text: string;
  fillColor: string;
}) => {
  return (
    <KonvaLabel
      position={{
        x: xPosition,
        y: yPosition,
      }}
      onClick={handleConfirmOrDeleteAnnotation}
      onTap={handleConfirmOrDeleteAnnotation}
      id={"label"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <KonvaTag
        cornerRadius={3}
        fill={fillColor}
        lineJoin={"round"}
        shadowColor={"black"}
        shadowBlur={10}
        shadowOffset={{ x: 5, y: 5 }}
      />
      <KonvaText
        fill={"white"}
        fontSize={14}
        padding={6}
        text={text}
        width={buttonWidth}
        height={buttonHeight}
        align={"center"}
        name={"transformer-button"}
      />
    </KonvaLabel>
  );
};
