import { useContext, useEffect, useRef, useState } from "react";
import {
  batch,
  Provider,
  useDispatch,
  useSelector,
  useStore,
} from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  useHotkeys,
  usePointerLocation,
  useAnnotationState,
  useStageHandlers,
  useAnnotationTool,
} from "hooks";

import { Cursor } from "./Cursor";
import { Layer } from "./Layer";
import { Selection } from "./Selection";
import { Annotations } from "./Annotations";
import { Image } from "./Image";

import { StageContext } from "contexts";
import { imageViewerSlice } from "store/imageViewer";
import { dataSlice } from "store/data";
import { annotatorSlice } from "store/annotator";
import {
  selectAnnotationState,
  selectToolType,
} from "store/annotator/selectors";
import { selectActiveImage } from "store/imageViewer/reselectors";
import {
  selectActiveImageId,
  selectActiveImageRenderedSrcs,
  selectImageIsloading,
  selectStagePosition,
} from "store/imageViewer/selectors";

import { generateUnknownCategory, generateUUID } from "utils/common/helpers";

import { CATEGORY_COLORS } from "store/data/constants";
import { dimensions } from "utils/common/constants";
import { AnnotationState, ToolType } from "utils/annotator/enums";
import { HotkeyContext } from "utils/common/enums";

import { Category, Kind } from "store/data/types";

const normalizeFont = 1300;

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
    getPositionRelativeToStage
  );

  const handleNewKind = (kindName: string, catName?: string) => {
    const kindCategories: Category[] = [];
    const newUnknownCategory = generateUnknownCategory(kindName);
    kindCategories.push(newUnknownCategory);
    if (catName) {
      const newId = generateUUID();
      const newCategory: Category = {
        id: newId,
        name: catName,
        containing: [],
        color: CATEGORY_COLORS.darkcyan,
        visible: true,
        kind: kindName,
      };
      kindCategories.push(newCategory);
    }
    const newKind: Kind = {
      id: kindName,
      categories: kindCategories.map((cat) => cat.id),
      containing: [],
      unknownCategoryId: newUnknownCategory.id,
    };

    batch(() => {
      dispatch(
        dataSlice.actions.addCategories({
          categories: kindCategories,
        })
      );

      dispatch(
        dataSlice.actions.addKinds({
          kinds: [newKind],
        })
      );
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: kindCategories.at(-1)!.id,
        })
      );
    });
    annotationTool.annotate(
      kindCategories.at(-1)!,
      activeImage!.activePlane,
      activeImageId!
    );
    dispatch(
      annotatorSlice.actions.setAnnotationState({
        annotationState: AnnotationState.Annotated,
        kind: kindName,
        annotationTool,
      })
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
      })
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
      })
    );
  }, [stageWidth, stageHeight, activeImage?.shape, dispatch]);

  useEffect(() => {
    setHtmlImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      })
    );
  }, [renderedSrcs, stageRef, dispatch]);

  useEffect(() => {
    stageRef?.current?.scale({ x: 1, y: 1 });
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: { x: 0, y: 0 },
      })
    );
  }, [activeImageId, stageRef, dispatch]);

  useHotkeys(
    "alt",
    (event) => {
      setDraggable(event.type === "keydown" ? true : false);
    },
    HotkeyContext.AnnotatorView,
    { keydown: true, keyup: true }
  );

  return (
    <>
      <ReactKonva.Stage
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
            <DndProvider backend={HTML5Backend}>
              <Layer>
                {!(htmlImages && htmlImages.length) ? (
                  <ReactKonva.Text
                    x={stageWidth / 6} //center depending on window width
                    y={0.4 * stageHeight}
                    width={(2 * stageWidth) / 3}
                    align="center"
                    text={
                      'To start annotating, drag and drop an image onto the canvas or click on "Open Image".'
                    }
                    fill={"black"}
                    fontSize={(30 * stageWidth) / normalizeFont} //scale font depending on window width
                  />
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
            </DndProvider>
          </StageContext.Provider>
        </Provider>
      </ReactKonva.Stage>
      <Box
        sx={{
          width: stageWidth - 24,
          height: dimensions.stageInfoHeight,
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          pr: "1.5rem",
        }}
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
    </>
  );
};

const NewKindDialog = ({
  open,
  onConfirm,
  onReject,
}: {
  open: boolean;
  onConfirm: (kindName: string, catName?: string) => void;
  onReject: (reason: string) => void;
}) => {
  const [kindName, setKindName] = useState<string>("");
  const [userTyped, setUserTyped] = useState<boolean>(false);
  const [categoryName, setCategoryName] = useState<string>("");
  const [error, setError] = useState<string>();
  const handleKindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKindName(e.target.value);
  };
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryName(e.target.value);
  };

  const handleConfirm = () => {
    if (!error) {
      const catName = categoryName.length > 0 ? categoryName : undefined;
      onConfirm(kindName, catName);
    }
  };

  // useEffect(() => {
  //   if (!userTyped && kindName.length !== 0) {
  //     setUserTyped(true);
  //   }
  // }, [kindName,userTyped]);

  useEffect(() => {
    if (!userTyped && kindName.length !== 0) {
      setUserTyped(true);
    } else if (userTyped && kindName.length === 0) {
      setError("Kind name cannot be blank");
    } else {
      setError(undefined);
    }
  }, [userTyped, kindName]);
  return (
    <>
      <Dialog
        fullWidth
        onClose={(event, reason) => onReject(reason)}
        open={open}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={1}
          pb={1.5}
          pt={1}
        >
          <DialogTitle sx={{ p: 1 }}>Create New Kind</DialogTitle>
          <IconButton
            onClick={() => onReject("cancelled")}
            sx={(theme) => ({
              maxHeight: "40px",
            })}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems={"center"}
            gap={2}
          >
            <TextField
              error={!!error}
              helperText={error}
              autoFocus
              fullWidth
              label="Kind Name"
              margin="dense"
              variant="standard"
              value={kindName}
              onChange={handleKindChange}
            />
            <TextField
              placeholder="Unknown"
              fullWidth
              label="Category Name"
              value={categoryName}
              margin="dense"
              variant="standard"
              onChange={handleCategoryChange}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onReject("cancelled")} color="primary">
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            color="primary"
            variant="contained"
            disabled={!!error}
          >
            Create Kind
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
