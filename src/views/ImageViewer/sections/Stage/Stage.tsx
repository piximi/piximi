import { useContext, useEffect, useRef, useState } from "react";
import {
  batch,
  Provider,
  useDispatch,
  useSelector,
  useStore,
} from "react-redux";
import Konva from "konva";
import { Stage as KonvaStage } from "react-konva";
import { Box, Typography } from "@mui/material";

import { useHotkeys } from "hooks";
import {
  useStageHandlers,
  usePointerLocation,
  useAnnotationState,
  useAnnotationTool,
} from "../../hooks";

import { NewKindDialog } from "views/ImageViewer/components/dialogs/NewKindDialog";
import { Cursor } from "./Cursor";
import { Layer } from "./Layer";
import { Selection } from "./Selection";
import { Annotations } from "./Annotations";
import { Image } from "./Image";

import { StageContext } from "../../state/StageContext";
import { imageViewerSlice } from "../../state/imageViewer";
import { annotatorSlice } from "../../state/annotator";
import {
  selectAnnotationState,
  selectToolType,
} from "../../state/annotator/selectors";
import {
  selectActiveImage,
  selectImageViewerObjectsArray,
} from "../../state/annotator/reselectors";
import {
  selectActiveImageId,
  selectActiveImageRenderedSrcs,
  selectImageIsloading,
  selectStagePosition,
} from "../../state/imageViewer/selectors";

import { generateKind, generateUUID } from "store/data/utils";

import { CATEGORY_COLORS } from "store/data/constants";
import { DIMENSIONS } from "utils/constants";
import { AnnotationState, ToolType } from "views/ImageViewer/utils/enums";
import { HotkeyContext } from "utils/enums";

import { Category } from "store/data/types";
import { createProtoAnnotation } from "views/ImageViewer/utils/annotationUtils";
import { Partition } from "utils/models/enums";

export const Stage = ({
  stageWidth,
  stageHeight,
}: {
  stageWidth: number;
  stageHeight: number;
}) => {
  const store = useStore();
  const dispatch = useDispatch();

  const [draggable, setDraggable] = useState<boolean>(false);
  const [htmlImages, setHtmlImages] = useState<HTMLImageElement[]>([]);
  // useRef
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useContext(StageContext);

  // useSelector
  const toolType = useSelector(selectToolType);
  const stagePosition = useSelector(selectStagePosition);
  const imageIsLoading = useSelector(selectImageIsloading);
  const annotationState = useSelector(selectAnnotationState);
  const renderedSrcs = useSelector(selectActiveImageRenderedSrcs);
  const activeImageId = useSelector(selectActiveImageId);
  const activeImage = useSelector(selectActiveImage);
  const existingObjects = useSelector(selectImageViewerObjectsArray);

  const { annotationTool } = useAnnotationTool();
  const { noKindAvailable, setNoKindAvailable } =
    useAnnotationState(annotationTool);

  const {
    absolutePosition,
    outOfBounds,
    setCurrentMousePosition,
    relativePositionByStage,
    pixelColor,
    getAbsolutePosition,
    getPositionRelativeToStage,
  } = usePointerLocation(imageRef, stageRef!, annotationTool.image);

  const {
    handleMouseUp,
    handleMouseDown,
    handleMouseMove,
    handleTouchMove,
    handleDblClickToZoom,
    handleZoomWheel,
    handleTouchStart,
    handleTouchEnd,
  } = useStageHandlers(
    stageRef,
    annotationTool,
    relativePositionByStage,
    absolutePosition,
    draggable,
    setDraggable,
    annotationState,
    outOfBounds,
    setCurrentMousePosition,
    getAbsolutePosition,
    getPositionRelativeToStage,
  );

  const handleNewKind = async (kindName: string, catName?: string) => {
    let newCategory: Category | undefined;
    const { kind: newKind, unknownCategory: unknownCategory } = generateKind(
      kindName,
      true,
    );
    if (catName) {
      const newId = generateUUID();
      newCategory = {
        id: newId,
        name: catName,
        containing: [],
        color: CATEGORY_COLORS.darkcyan,
        visible: true,
        kind: newKind.id,
      };
    }

    batch(() => {
      dispatch(
        annotatorSlice.actions.addKind({
          kind: newKind,
          unknownCategory: unknownCategory,
        }),
      );
      if (newCategory) {
        dispatch(
          annotatorSlice.actions.addCategory({
            category: newCategory,
          }),
        );
      }
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: newCategory ? newCategory.id : unknownCategory.id,
        }),
      );
    });
    if (!activeImage) throw new Error("Active image not found");
    if (!annotationTool.decodedMask) throw new Error("No mask found");
    if (!annotationTool.boundingBox) throw new Error("No bounding box found");

    const newAnnotation = await createProtoAnnotation(
      {
        boundingBox: annotationTool.boundingBox,
        categoryId: (newCategory ?? unknownCategory).id,
        imageId: activeImage.id,
        decodedMask: annotationTool.decodedMask,
        activePlane: activeImage.activePlane,
        partition: Partition.Unassigned,
      },
      activeImage,
      newKind,
      existingObjects.map((obj) => obj.name),
    );
    dispatch(
      annotatorSlice.actions.setWorkingAnnotation({
        annotation: newAnnotation,
      }),
    );
    dispatch(
      annotatorSlice.actions.setAnnotationState({
        annotationState: AnnotationState.Annotated,
        kind: newKind.id,
        annotationTool,
      }),
    );

    //setNoKindAvailable(false);
    handleClose();
  };

  const handleClose = (reason?: string) => {
    if (
      reason === "backdropClick" ||
      reason === "escapeKeyDown" ||
      reason === "cancelled"
    ) {
      annotationTool.deselect();
    }
    setNoKindAvailable(false);
  };

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    const stage = stageRef.current;
    dispatch(
      imageViewerSlice.actions.updateZoomSelection({
        changes: {
          centerPoint: {
            x: (stageWidth / 2) * stage.scaleX() + stage.x(),
            y: (stageHeight / 2) * stage.scaleX() + stage.y(),
          },
        },
      }),
    );
  }, [draggable, stageRef, dispatch, stageHeight, stageWidth]);

  useEffect(() => {
    console.log(activeImage);
    if (!activeImage?.shape) return;
    dispatch(
      imageViewerSlice.actions.setImageOrigin({
        origin: {
          x: (stageWidth - activeImage.shape.width) / 2,
          y: (stageHeight - activeImage.shape.height) / 2,
        },
      }),
    );
  }, [stageWidth, stageHeight, activeImage?.shape, dispatch]);

  useEffect(() => {
    setHtmlImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      }),
    );
  }, [renderedSrcs, stageRef, dispatch]);

  useEffect(() => {
    stageRef?.current?.scale({ x: 1, y: 1 });
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: { x: 0, y: 0 },
      }),
    );
  }, [activeImageId, stageRef, dispatch]);

  useHotkeys(
    "alt",
    (event) => {
      setDraggable(event.type === "keydown" ? true : false);
    },
    HotkeyContext.AnnotatorView,
    { keydown: true, keyup: true },
  );

  return (
    <Box sx={{ zIndex: 999 }}>
      <KonvaStage
        draggable={draggable}
        height={stageHeight}
        onMouseDown={(evt) => {
          handleMouseDown(evt);
        }}
        onTouchStart={(evt) => {
          handleTouchStart(evt);
        }}
        onMouseMove={(evt) => handleMouseMove(evt)}
        onTouchMove={(evt) => handleTouchMove(evt)}
        onMouseUp={(evt) => handleMouseUp(evt)}
        onTouchEnd={(evt) => handleTouchEnd(evt)}
        onWheel={(evt) => handleZoomWheel(evt)}
        onDblClick={(evt) => handleDblClickToZoom(evt)}
        on
        position={stagePosition}
        ref={stageRef}
        width={stageWidth}
      >
        <Provider store={store}>
          <StageContext.Provider value={stageRef}>
            <Layer>
              {!(htmlImages && htmlImages.length) ? (
                <></>
              ) : !imageIsLoading ? (
                <Image
                  ref={imageRef}
                  images={htmlImages}
                  stageHeight={stageHeight}
                  stageWidth={stageWidth}
                />
              ) : (
                <></>
              )}
              {(annotationState === AnnotationState.Annotating ||
                toolType === ToolType.QuickAnnotation) && ( //TODO: remind myself why quick annotation special
                <Selection tool={annotationTool} toolType={toolType} />
              )}
              <Cursor
                positionByStage={relativePositionByStage}
                absolutePosition={absolutePosition}
                annotationState={annotationState}
                outOfBounds={outOfBounds}
                draggable={draggable}
                toolType={toolType}
              />
              {!imageIsLoading && (
                <Annotations annotationTool={annotationTool} />
              )}
            </Layer>
          </StageContext.Provider>
        </Provider>
      </KonvaStage>
      <Box
        sx={(theme) => ({
          backgroundColor: theme.palette.background.paper,
          // -2 because of border overlap, dont know why the global border-box sizing is being respected here though
          width: stageWidth - 2,
          height: DIMENSIONS.stageInfoHeight,
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          px: "1.5rem",
        })}
      >
        {!outOfBounds && absolutePosition && (
          <>
            <Typography>{`x: ${absolutePosition.x} y: ${absolutePosition.y} `}</Typography>
            <Typography>{pixelColor}</Typography>
          </>
        )}
      </Box>
      {noKindAvailable && (
        <NewKindDialog
          open={noKindAvailable}
          onConfirm={handleNewKind}
          onReject={handleClose}
        />
      )}
    </Box>
  );
};
