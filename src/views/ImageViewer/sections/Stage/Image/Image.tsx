import React, {
  forwardRef,
  memo,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import { Image as KonvaImage } from "react-konva";

import { Point } from "utils/types";

import {
  selectActiveImageSeries,
  selectActivePlane,
  selectImageOrigin,
} from "views/ImageViewer/state/imageViewer/selectors";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";
import { StageContext } from "views/ImageViewer/state/StageContext";

export const Image = React.forwardRef<
  Konva.Image,
  { stageWidth: number; stageHeight: number /*images: HTMLImageElement[]*/ }
>(
  (
    { stageWidth: _stageWidth, stageHeight: _stageHeight /*, images*/ },
    ref,
  ) => {
    const activeImage = useSelector(selectActiveImage);
    const activePlane = useSelector(selectActivePlane);
    const activeImageSeries = useSelector(selectActiveImageSeries);
    //const stageRef = useContext(StageContext);
    const dispatch = useDispatch();
    const [htmlImages, setHtmlImages] = useState<HTMLImageElement[]>([]);

    const [filters] = useState<Array<any>>();
    const imagePosition = useSelector(selectImageOrigin);
    useEffect(() => {
      if (!activeImageSeries || !activeImageSeries.activeSrcs) return;
      if (activeImageSeries.activeSrcs.length === 1) {
        const imgElem = document.createElement("img");
        imgElem.src =
          activeImageSeries.timepoints[
            activeImageSeries.activeTimepoint
          ].ZTPreview;
        setHtmlImages([imgElem]);
      } else {
        setHtmlImages(
          activeImageSeries.activeSrcs.map((src: string) => {
            const imgElem = document.createElement("img");
            imgElem.src = src;
            return imgElem;
          }),
        );
      }
    }, [activeImageSeries, /*stageRef,*/ dispatch]);

    return (
      <>
        {htmlImages.map((image, idx) => (
          <MemoizedKonvaImage
            image={image}
            // 100 for no particular reason; shouldn't happen
            height={activeImage?.shape.height || 100}
            width={activeImage?.shape.width || 100}
            imagePosition={imagePosition!}
            activePlane={
              activeImageSeries?.activeSrcs &&
              activeImageSeries?.activeSrcs.length > 1 &&
              activePlane
                ? activePlane
                : 0
            }
            filters={filters!}
            idx={idx}
            key={idx}
            ref={ref}
          />
        ))}
      </>
    );
  },
);

interface KonvaImageProps {
  image: HTMLImageElement;
  height: number;
  width: number;
  imagePosition: Point;
  activePlane: number;
  filters: any[];
  idx: number;
}

export const MemoizedKonvaImage = memo(
  forwardRef<Konva.Image, KonvaImageProps>((props, ref) => {
    return (
      <KonvaImage
        height={props.height}
        image={props.image}
        ref={ref}
        width={props.width}
        filters={props.filters}
        visible={props.idx === props.activePlane}
        position={props.imagePosition}
        key={props.idx}
      />
    );
  }),
);
