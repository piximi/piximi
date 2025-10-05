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
import { Box, useTheme } from "@mui/material";

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
import { selectStagePosition } from "../../state/imageViewer/selectors";

import { generateKind, generateUUID } from "store/data/utils";

import { CATEGORY_COLORS } from "store/data/constants";
import { AnnotationState, ToolType } from "views/ImageViewer/utils/enums";
import { HotkeyContext } from "utils/enums";

import { Category } from "store/data/types";
import { createProtoAnnotation } from "views/ImageViewer/utils/annotationUtils";
import { Partition } from "utils/models/enums";
import { ActiveImageInfoContainer } from "./ActiveImageInfoContainer";
import { ImageViewModeDrawer } from "../image-view-mode-drawer/ImageViewModeDrawer";
import { dataSlice } from "store/data";
import { selectAllAnnotations } from "store/data/selectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { selectActiveImage } from "views/ImageViewer/state/image-viewer-data/reselectors";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import React from "react";

export const Stage = React.memo(
  ({
    stageWidth,
    stageHeight,
  }: {
    stageWidth: number;
    stageHeight: number;
  }) => {
    const store = useStore();
    const theme = useTheme();
    const dispatch = useDispatch();

    const [draggable, setDraggable] = useState<boolean>(false);
    //const [htmlImages, setHtmlImages] = useState<HTMLImageElement[]>([]);

    // useRef
    const imageRef = useRef<Konva.Image | null>(null);
    const stageRef = useContext(StageContext);

    // data Selectors
    const activeMetadata = useSelector(selectActiveMetadata);
    const activeImage = useSelector(selectActiveImage);
    const existingAnnotations = useSelector(selectAllAnnotations);

    // tool selectors
    const toolType = useSelector(selectToolType);
    const annotationState = useSelector(selectAnnotationState);

    // stage selectors
    const stagePosition = useSelector(selectStagePosition);

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
          color: CATEGORY_COLORS.darkcyan,
          visible: true,
          kind: newKind.id,
        };
      }

      batch(() => {
        dispatch(
          dataSlice.actions.addKind({
            kind: newKind,
            unknownCategory: unknownCategory,
          }),
        );
        if (newCategory) {
          dispatch(dataSlice.actions.addCategory(newCategory));
        }
        dispatch(
          imageViewerDataSlice.actions.setSelectedCategoryId(
            newCategory ? newCategory.id : unknownCategory.id,
          ),
        );
      });
      if (!activeImage || !activeMetadata)
        throw new Error("Active image not found");
      if (!annotationTool.decodedMask) throw new Error("No mask found");
      if (!annotationTool.boundingBox) throw new Error("No bounding box found");

      const newAnnotation = createProtoAnnotation(
        {
          boundingBox: annotationTool.boundingBox,
          categoryId: (newCategory ?? unknownCategory).id,
          imageId: activeMetadata.id,
          decodedMask: annotationTool.decodedMask,
          activePlane: activeMetadata.activePlane,
          plane: activeMetadata.activePlane,
          timepoint: activeImage.timepoint ?? 0,
          partition: Partition.Unassigned,
        },
        activeImage,
        newKind,
        existingAnnotations.map((obj) => obj.name),
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

      setNoKindAvailable(false);
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
      stageRef?.current?.scale({ x: 1, y: 1 });
      dispatch(
        imageViewerSlice.actions.setStagePosition({
          stagePosition: { x: 0, y: 0 },
        }),
      );
    }, [activeMetadata?.id, stageRef, dispatch]);

    useHotkeys(
      "alt",
      (event) => {
        setDraggable(event.type === "keydown" ? true : false);
      },
      HotkeyContext.AnnotatorView,
      { keydown: true, keyup: true },
    );

    return (
      <Box
        sx={{
          zIndex: 999,
          position: "relative",
          overflow: "hidden",
        }}
      >
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
          style={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
          }}
        >
          <Provider store={store}>
            <StageContext.Provider value={stageRef}>
              <Layer>
                {!activeImage || !activeMetadata ? (
                  <></>
                ) : (
                  <Image
                    ref={imageRef}
                    stageHeight={stageHeight}
                    stageWidth={stageWidth}
                  />
                )}
                {(annotationState === AnnotationState.Annotating ||
                  toolType === ToolType.QuickAnnotation) && (
                  <Selection tool={annotationTool} toolType={toolType} />
                )}
              </Layer>
              <Layer>
                <Cursor
                  positionByStage={relativePositionByStage}
                  absolutePosition={absolutePosition}
                  annotationState={annotationState}
                  outOfBounds={outOfBounds}
                  draggable={draggable}
                  toolType={toolType}
                />
              </Layer>
              <Layer>
                {activeImage && <Annotations annotationTool={annotationTool} />}
              </Layer>
            </StageContext.Provider>
          </Provider>
        </KonvaStage>

        <ImageViewModeDrawer />

        <ActiveImageInfoContainer
          absolutePosition={absolutePosition}
          pixelColor={pixelColor}
          width={stageWidth}
          show={!outOfBounds}
        />
        {noKindAvailable && (
          <NewKindDialog
            open={noKindAvailable}
            onConfirm={handleNewKind}
            onReject={handleClose}
          />
        )}
      </Box>
    );
  },
);
