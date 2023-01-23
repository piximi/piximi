import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import _ from "lodash";
import * as ImageJS from "image-js";
import useSound from "use-sound";

import {
  imageViewerSlice,
  imageWidthSelector,
  stageScaleSelector,
  selectedAnnotationSelector,
  selectedAnnotationsSelector,
  soundEnabledSelector,
  activeImageIdSelector,
  cursorSelector,
  imageHeightSelector,
  setSelectedAnnotations,
  unselectedAnnotationsSelector,
} from "store/image-viewer";

import { AnnotationModeType, AnnotationStateType, AnnotationType } from "types";

import { AnnotationTool } from "annotator/image/Tool";
import { decode, encode } from "annotator/image/helpers";
import createAnnotationSoundEffect from "annotator/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "annotator/sounds/pop-up-off.mp3";

type box = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type TransformerProps = {
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

export const Transformer = ({
  transformPosition,
  annotationId,
  annotationTool,
}: TransformerProps) => {
  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);

  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  const transformerRef = useRef<Konva.Transformer | null>(null);

  const activeImageId = useSelector(activeImageIdSelector);

  const dispatch = useDispatch();

  const [boundBox, setBoundBox] = useState<box | null>(null);

  const [startBox, setStartBox] = useState<box>({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    rotation: 0,
  });

  const [center, setCenter] = useState<{ x: number; y: number } | undefined>();

  const stageScale = useSelector(stageScaleSelector);

  const cursor = useSelector(cursorSelector);

  const soundEnabled = useSelector(soundEnabledSelector);

  const imageWidth = useSelector(imageWidthSelector);
  const imageHeight = useSelector(imageHeightSelector);

  const [playCreateAnnotationSoundEffect] = useSound(
    createAnnotationSoundEffect
  );

  const [playDeleteAnnotationSoundEffect] = useSound(
    deleteAnnotationSoundEffect
  );

  const boundingBoxFunc = (oldBox: box, newBox: box) => {
    if (!boundBox) {
      setStartBox(oldBox);
    }

    const relativeNewBox = getRelativeBox(newBox);

    if (!imageWidth || !imageHeight || !relativeNewBox)
      return boundBox ? boundBox : startBox;

    const minimumBoxArea = 5;

    if (
      relativeNewBox.width < minimumBoxArea ||
      relativeNewBox.height < minimumBoxArea
    )
      return boundBox ? boundBox : oldBox;

    if (
      Math.floor(relativeNewBox.x + relativeNewBox.width) > imageWidth ||
      Math.floor(relativeNewBox.y + relativeNewBox.height) > imageHeight ||
      relativeNewBox.x < 0 ||
      relativeNewBox.y < 0
    ) {
      return boundBox ? boundBox : oldBox;
    }

    setBoundBox(newBox);
    return newBox;
  };

  /*
   * Obtain box coordinates in image space
   */
  const getRelativeBox = (boundBox: box) => {
    const relativePosition = transformPosition({
      x: boundBox.x,
      y: boundBox.y,
    });
    if (!relativePosition) return;
    return {
      x: relativePosition.x / stageScale,
      y: relativePosition.y / stageScale,
      height: boundBox.height / stageScale,
      width: boundBox.width / stageScale,
      rotation: 0,
    };
  };

  const getScaledCoordinate = (
    contour: Array<number>,
    center: { x: number; y: number },
    scale: { x: number; y: number }
  ) => {
    return _.flatten(
      _.map(_.chunk(contour, 2), (el: Array<number>) => {
        return [
          Math.round(center.x + scale.x * (el[0] - center.x)),
          Math.round(center.y + scale.y * (el[1] - center.y)),
        ];
      })
    );
  };

  const onTransformEnd = () => {
    if (!selectedAnnotation) return;

    if (!boundBox || !startBox) return;

    if (!imageWidth || !imageHeight) return;

    const relativeBoundBox = getRelativeBox(boundBox);
    const relativeStartBox = getRelativeBox(startBox);

    if (!relativeBoundBox || !relativeStartBox || !center) return;

    // get necessary parameters for transformation
    const scaleX = relativeBoundBox.width / relativeStartBox.width;
    const scaleY = relativeBoundBox.height / relativeStartBox.height;

    //extract roi and resize
    const mask = selectedAnnotation.mask;
    const boundingBox = selectedAnnotation.boundingBox;

    const roiWidth = boundingBox[2] - boundingBox[0];
    const roiHeight = boundingBox[3] - boundingBox[1];
    const roiX = boundingBox[0];
    const roiY = boundingBox[1];

    const decodedData = new Uint8Array(decode(mask));

    if (!roiWidth || !roiHeight) return;

    const roi = new ImageJS.Image(roiWidth, roiHeight, decodedData, {
      components: 1,
      alpha: 0,
    });

    const resizedMaskROI = roi.resize({
      height: Math.round(roiHeight * scaleY),
      width: Math.round(roiWidth * scaleX),
      preserveAspectRatio: false,
    });

    const scaledOffset = getScaledCoordinate([roiX, roiY], center, {
      x: scaleX,
      y: scaleY,
    });

    const resizedMask = encode(Uint8Array.from(resizedMaskROI.data));

    const updatedAnnotation = {
      ...selectedAnnotation,
      boundingBox: [
        scaledOffset[0],
        scaledOffset[1],
        scaledOffset[0] + resizedMaskROI.width,
        scaledOffset[1] + resizedMaskROI.height,
      ] as [number, number, number, number],
      mask: resizedMask,
    };

    dispatch(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [],
        selectedAnnotation: undefined,
      })
    );

    updateSelectedAnnotation(updatedAnnotation);

    setCenter(undefined);
    setBoundBox(null);
  };

  const updateSelectedAnnotation = (updatedAnnotation: AnnotationType) => {
    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [updatedAnnotation],
        selectedAnnotation: updatedAnnotation,
      })
    );
  };

  const getOppositeAnchorPosition = () => {
    if (!transformerRef || !transformerRef.current) return { x: 0, y: 0 };
    const activeAnchor = transformerRef.current.getActiveAnchor();
    switch (activeAnchor) {
      case "bottom-right": {
        return transformerRef.current
          .findOne(".".concat("top-left"))
          .position();
      }
      case "bottom-center": {
        return transformerRef.current
          .findOne(".".concat("top-center"))
          .position();
      }
      case "bottom-left": {
        return transformerRef.current
          .findOne(".".concat("top-right"))
          .position();
      }
      case "middle-left": {
        return transformerRef.current
          .findOne(".".concat("middle-right"))
          .position();
      }
      case "top-left": {
        return transformerRef.current
          .findOne(".".concat("bottom-right"))
          .position();
      }
      case "top-center": {
        return transformerRef.current
          .findOne(".".concat("bottom-center"))
          .position();
      }
      case "top-right": {
        return transformerRef.current
          .findOne(".".concat("bottom-left"))
          .position();
      }
      case "middle-right": {
        return transformerRef.current
          .findOne(".".concat("middle-left"))
          .position();
      }
      default: {
        return { x: 0, y: 0 };
      }
    }
  };

  const onTransform = () => {
    if (!center) {
      //at the beginning of transform, find out the "center" coordinate used for the resizing (i.e., the coordinate that does not move during resize)
      const oppositeAnchorPosition = getOppositeAnchorPosition();
      const scaledOppositeAnchorPosition = {
        x: oppositeAnchorPosition.x / stageScale,
        y: oppositeAnchorPosition.y / stageScale,
      };

      const relativeStartBox = getRelativeBox(startBox);

      if (!relativeStartBox) return;

      setCenter({
        x: scaledOppositeAnchorPosition.x + relativeStartBox.x,
        y: scaledOppositeAnchorPosition.y + relativeStartBox.y,
      });
    }
  };

  const onTransformStart = () => {
    const selected = selectedAnnotations.find((annotation: AnnotationType) => {
      return annotation.id === annotationId;
    });

    if (!selected) return;

    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [selected],
        selectedAnnotation: selected,
      })
    );
  };

  const clearAnnotations = () => {
    if (annotationTool) {
      annotationTool.deselect();
    } else {
      dispatch(
        imageViewerSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool: annotationTool,
          execSaga: true,
        })
      );
    }

    dispatch(
      imageViewerSlice.actions.setSelectionMode({
        selectionMode: AnnotationModeType.New,
      })
    );

    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [],
        selectedAnnotation: undefined,
      })
    );
  };

  const onSaveAnnotationClick = (event: Konva.KonvaEventObject<Event>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;

    if (!activeImageId) return;

    dispatch(
      imageViewerSlice.actions.setImageInstances({
        instances: [...unselectedAnnotations, ...selectedAnnotations],
        imageId: activeImageId,
      })
    );

    transformerRef.current!.detach();
    transformerRef.current!.getLayer()?.batchDraw();

    clearAnnotations();
    if (soundEnabled) playCreateAnnotationSoundEffect();
  };

  const onClearAnnotationClick = (event: Konva.KonvaEventObject<Event>) => {
    const container = event.target.getStage()!.container();
    container.style.cursor = cursor;

    clearAnnotations();
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

  let posX = 0;
  let posY = 0;

  if (selectedAnnotation && selectedAnnotations.length === 1) {
    posX =
      Math.max(
        selectedAnnotation.boundingBox[0],
        selectedAnnotation.boundingBox[2]
      ) * stageScale;
    posY =
      Math.max(
        selectedAnnotation.boundingBox[1],
        selectedAnnotation.boundingBox[3]
      ) * stageScale;
  }

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Transformer
          boundBoxFunc={boundingBoxFunc}
          onTransform={onTransform}
          onTransformEnd={onTransformEnd}
          onTransformStart={onTransformStart}
          id={"tr-".concat(annotationId)}
          ref={transformerRef}
          rotateEnabled={false}
        />
        {selectedAnnotation && selectedAnnotations.length === 1 && (
          <>
            <ReactKonva.Group>
              <ReactKonva.Label
                position={{
                  x: posX - 58,
                  y: posY + 6,
                }}
                onClick={onSaveAnnotationClick}
                onTap={onSaveAnnotationClick}
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
                  text={"Confirm"}
                />
              </ReactKonva.Label>
              <ReactKonva.Label
                position={{
                  x: posX - 52,
                  y: posY + 35,
                }}
                onClick={onClearAnnotationClick}
                onTap={onClearAnnotationClick}
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
                />
              </ReactKonva.Label>
            </ReactKonva.Group>
          </>
        )}
      </ReactKonva.Group>
    </>
  );
};
