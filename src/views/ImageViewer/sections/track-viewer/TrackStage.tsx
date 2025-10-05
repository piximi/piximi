import { useTheme } from "@mui/material";
import { KonvaEventObject } from "konva/lib/Node";
import {
  Stage as KonvaStage,
  Image as KonvaImage,
  Layer,
  Line,
} from "react-konva";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  batch,
  Provider,
  useDispatch,
  useSelector,
  useStore,
} from "react-redux";
import {
  selectImageToAnnotations,
  selectMetadataEntities,
  selectTrackletRecord,
} from "store/data/selectors";
import { Point } from "utils/types";
import {
  selectActiveMetadata,
  selectActiveTrackId,
  selectTimeLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { StageContext } from "views/ImageViewer/state/StageContext";
import { useSelectedTracklets } from "views/ImageViewer/state/TrackletContext";
import { getNewWheelPos } from "./utils";
import React from "react";
import {
  AnnotationProps,
  AnnotationsProps,
  AnnotationWithImOff,
  AnnotationWithTrackId,
} from "./types";
import {
  selectActiveTimeLinkedAnnId,
  selectActiveTrackImageToAnnotation,
  selectAllImageViewerAnnotationRecord,
} from "views/ImageViewer/state/image-viewer-data/reselectors";
import { colorOverlayROI, hexToRGBA } from "views/ImageViewer/utils";
import { ProtoAnnotationObject } from "views/ImageViewer/state/types";
import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "store/data/constants";
import { dataSlice } from "store/data";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";

const IMAGE_SPACING = 20;

export const TrackStage = ({
  stageWidth,
  stageHeight,
}: {
  stageWidth: number;
  stageHeight: number;
}) => {
  const store = useStore();
  const theme = useTheme();
  const [htmlImages, setHtmlImages] = useState<
    Record<string, { image: HTMLImageElement; pos: Point }>
  >({});
  const dispatch = useDispatch();
  const stageRef = useContext(StageContext);
  const activeMetadata = useSelector(selectActiveMetadata);
  const metadataEntities = useSelector(selectMetadataEntities);
  const activeTrackId = useSelector(selectActiveTrackId);
  const activeTraclIm2Ann = useSelector(selectActiveTrackImageToAnnotation);
  const manualLinkingActive = useSelector(selectTimeLinkingState);
  const [stagePosition, setstagePosition] = useState({ x: 0, y: 0 });
  const { primaryTrack, secondaryTracks, setPrimaryTrack, setSecondaryTracks } =
    useSelectedTracklets();

  const imageSrcs = useMemo(() => {
    if (!activeMetadata) return [];
    return Object.values(activeMetadata.images).map((image) => image.ZTPreview);
  }, [activeMetadata?.id]);

  const globalShape = useMemo(() => {
    const activeMetadataId = activeMetadata?.id;
    if (!activeMetadataId) return { width: 0, height: 0 };
    const { planes, channels, ...size } =
      metadataEntities[activeMetadataId].shape;
    return size;
  }, [metadataEntities, activeMetadata?.id]);

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    if (!activeMetadata) return;
    const newPos = getNewWheelPos(event);
    if (newPos) setstagePosition(newPos);
  };
  useEffect(() => {
    if (!activeMetadata || globalShape.width === 0) return;
    const imageElems: Record<string, { image: HTMLImageElement; pos: Point }> =
      {};
    Object.entries(activeMetadata.images).forEach(([id, image], idx) => {
      const imgElem = document.createElement("img");
      imgElem.src = image.ZTPreview;
      imageElems[id] = {
        image: imgElem,
        pos: {
          x: globalShape.width * idx + IMAGE_SPACING * (idx + 1),
          y: (stageHeight - globalShape.height) / 2,
        },
      };
    });
    setHtmlImages(imageElems);
  }, [activeMetadata?.id, globalShape, imageSrcs, stageHeight]);

  useLayoutEffect(() => {
    const stage = stageRef?.current;
    if (!stage || globalShape.height === 0) return;

    const center = {
      x: (stage.width() / 2) * stage.scaleX() + stage.x(),
      y: (stage.height() / 2) * stage.scaleX() + stage.y(),
    };
    // console.log("stageHeight prop: ", stageHeight);
    // console.log("event.stage.height: ", stage.height());
    // console.log("imageHeight: ", globalShape.height);
    //const heightScale = globalShape.height / stageHeight;
    const heightScale = (stageHeight - 80) / globalShape.height;
    const stageX = stage.x();
    const stageY = stage.y();
    const stageScale = stage.scaleX();
    const mousePointTo = {
      x: (center.x - stageX!) / stageScale,
      y: (center.y - stageY!) / stageScale,
    };
    // console.log("heightScale: ", heightScale);
    // console.log("centerY: ", center.y);
    // console.log("mousePointTo: ", mousePointTo.y);
    // console.log(
    //   "center.y - mousePointTo.y * heightScale: ",
    //   `${center.y} - ${mousePointTo.y} * ${heightScale} = ${center.y} - ${mousePointTo.y * heightScale} = ${center.y - mousePointTo.y * heightScale}`,
    // );

    const newPos = {
      x: 0,
      y: 0, //center.y - mousePointTo.y * heightScale,
    };
    // stage.scale({ x: heightScale, y: heightScale });
    // stage.position(newPos);
    // setstagePosition(newPos);
  }, [globalShape, stageHeight]);
  const handleTracking = useCallback(
    (currentAnnotation: ProtoAnnotationObject) => {
      let annTrackId = currentAnnotation.trackId;
      // If the current annotation belongs to a track, check to see if it is the active track
      // if not, do nothing
      if (annTrackId && annTrackId !== activeTrackId) return;
      const activeTimeLinkedAnnId =
        activeTraclIm2Ann[currentAnnotation.imageId];
      // Assign a track ID to annotation if one doesnt exist
      if (!annTrackId) {
        annTrackId = activeTrackId!; // Can assert Truthy since tLinkingActive is true
        batch(() => {
          dispatch(
            dataSlice.actions.updateAnnotation({
              id: currentAnnotation.id,
              changes: { trackId: annTrackId },
            }),
          );
          dispatch(
            dataSlice.actions.addAnnotationToTrackletRecord({
              trackId: annTrackId!,
              annId: currentAnnotation.id,
            }),
          );
        });

        if (activeTimeLinkedAnnId) {
          dataSlice.actions.updateAnnotation({
            id: currentAnnotation.id,
            changes: { trackId: undefined },
          });
          dispatch(
            dataSlice.actions.removeAnnotationFromTrackletRecord({
              trackId: annTrackId,
              annId: activeTimeLinkedAnnId,
            }),
          );
        }
      } else {
        if (activeTimeLinkedAnnId) {
          dispatch(
            dataSlice.actions.updateAnnotation({
              id: currentAnnotation.id,
              changes: { trackId: undefined },
            }),
          );
          dispatch(
            dataSlice.actions.removeAnnotationFromTrackletRecord({
              trackId: annTrackId,
              annId: activeTimeLinkedAnnId,
            }),
          );
        }
        if (activeTimeLinkedAnnId !== currentAnnotation.id) {
          dataSlice.actions.updateAnnotation({
            id: currentAnnotation.id,
            changes: { trackId: annTrackId },
          });
          dispatch(
            dataSlice.actions.addAnnotationToTrackletRecord({
              trackId: annTrackId,
              annId: currentAnnotation.id,
            }),
          );
        }
      }
      dispatch(
        imageViewerDataSlice.actions.toggleTLinkedAnnotation({
          annId: currentAnnotation.id,
          imId: currentAnnotation.imageId,
        }),
      );
    },
    [activeTrackId, activeTraclIm2Ann],
  );

  const handleMouseClick = useCallback(
    (annotation: ProtoAnnotationObject) => {
      if (manualLinkingActive) {
        handleTracking(annotation);
      } else {
        if (!annotation.trackId) return;
        if (!primaryTrack) {
          setPrimaryTrack(annotation.trackId);

          return;
        }
        if (annotation.trackId === primaryTrack) {
          setPrimaryTrack(secondaryTracks[0]);
          setSecondaryTracks(secondaryTracks.slice(1));
          return;
        }
        if (secondaryTracks.includes(annotation.trackId)) {
          setSecondaryTracks(
            secondaryTracks.filter((id) => id !== annotation.trackId),
          );
          return;
        }
        setSecondaryTracks([...secondaryTracks, annotation.trackId]);
      }
    },
    [primaryTrack, secondaryTracks, handleTracking],
  );
  const selectedTracks = useMemo(() => {
    if (!primaryTrack) return [];
    return [primaryTrack, ...secondaryTracks];
  }, [primaryTrack, secondaryTracks]);

  useEffect(() => {
    console.log("stage: ", stageWidth);
  }, [stageWidth]);

  return (
    <KonvaStage
      draggable={true}
      width={stageWidth}
      height={stageHeight}
      onWheel={handleWheel}
      on
      position={stagePosition}
      ref={stageRef}
      style={{
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Provider store={store}>
        <StageContext.Provider value={stageRef}>
          <Layer>
            {Object.values(htmlImages).map((image, idx) => {
              return (
                <KonvaImage
                  width={globalShape.width}
                  height={globalShape.height}
                  image={image.image}
                  position={image.pos}
                  key={`track-viewer-image-${idx}`}
                />
              );
            })}
          </Layer>

          {/* <Layer>
              <Cursor
                positionByStage={relativePositionByStage}
                absolutePosition={absolutePosition}
                annotationState={annotationState}
                outOfBounds={outOfBounds}
                draggable={draggable}
                toolType={toolType}
              />
            </Layer>
            */}
          <Layer>
            <Annotations
              imageShape={globalShape}
              images={htmlImages}
              onClick={handleMouseClick}
              selectedTracks={selectedTracks}
            />
          </Layer>
        </StageContext.Provider>
      </Provider>
    </KonvaStage>
  );
};

export const Annotations = ({
  imageShape,
  images,
  selectedTracks,
  onClick,
}: AnnotationsProps) => {
  const tracklets = useSelector(selectTrackletRecord);
  const annotations = useSelector(selectAllImageViewerAnnotationRecord);
  const imageToAnnotations = useSelector(selectImageToAnnotations);
  const activeMetadata = useSelector(selectActiveMetadata);

  const visibleAnnotations = useMemo(() => {
    if (!activeMetadata) return [];
    const visibleAnnotations: AnnotationWithImOff[] = [];
    Object.keys(activeMetadata.images).forEach((imageId) => {
      const imAnnotations = imageToAnnotations[imageId];
      imAnnotations.forEach((annId) => {
        const ann = annotations[annId];
        if (ann.decodedMask)
          if (images[ann.imageId]) {
            visibleAnnotations.push({
              ...ann,
              imageOffset: images[ann.imageId].pos,
            } as AnnotationWithImOff);
          }
      });
    });
    return visibleAnnotations;
  }, [annotations, activeMetadata, imageToAnnotations, images]);

  const getFillColor = (trackId: string | undefined) => {
    if (!trackId) return UNKNOWN_IMAGE_CATEGORY_COLOR;
    const trackColor = tracklets[trackId].color;
    if (selectedTracks.includes(trackId)) return trackColor + "ff";
    return trackColor + "77";
  };

  return images ? (
    <>
      {visibleAnnotations.map((annotation) => (
        <Annotation
          key={annotation.id}
          annotation={annotation}
          imageShape={imageShape}
          imagePosition={annotation.imageOffset}
          fillColor={getFillColor(annotation.trackId)}
          selected={true}
          isFiltered={false}
          onSelect={() => onClick(annotation)}
        />
      ))}
    </>
  ) : (
    <></>
  );
};

export const Annotation = React.memo(
  ({
    annotation,
    imageShape,
    imagePosition,
    fillColor,
    isFiltered,
    onSelect,
  }: AnnotationProps) => {
    const imageWidth = useMemo(() => imageShape.width, [imageShape]);
    const imageHeight = useMemo(() => imageShape.height, [imageShape]);

    const imageMask = useMemo(() => {
      const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
      const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];
      if (!boxWidth || !boxHeight || !annotation.decodedMask) return;
      if (Math.round(boxWidth) <= 0 || Math.round(boxHeight) <= 0) return;

      const color = hexToRGBA(fillColor, 0);

      return colorOverlayROI(
        annotation.decodedMask,
        annotation.boundingBox,
        imageWidth,
        imageHeight,
        color,
        1,
      );
    }, [
      annotation.decodedMask,
      fillColor,
      annotation.boundingBox,
      imageWidth,
      imageHeight,
    ]);

    return (
      <KonvaImage
        id={annotation.id}
        image={imageMask}
        x={annotation.boundingBox[0] + imagePosition.x}
        y={annotation.boundingBox[1] + imagePosition.y}
        width={Math.round(
          annotation.boundingBox[2] - annotation.boundingBox[0],
        )}
        height={Math.round(
          annotation.boundingBox[3] - annotation.boundingBox[1],
        )}
        strokeWidth={100}
        fillPatternX={20}
        visible={!isFiltered}
        onClick={onSelect}

        //scale={{ x: stageScale, y: stageScale }}
      />
    );
  },
);
