import React, {
  forwardRef,
  memo,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import { Image as KonvaImage } from "react-konva";

import { Point } from "utils/types";

import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { selectActiveImage } from "views/ImageViewer/state/image-viewer-data/reselectors";

export const Image = React.forwardRef<
  Konva.Image,
  { stageWidth: number; stageHeight: number /*images: HTMLImageElement[]*/ }
>(
  (
    { stageWidth: _stageWidth, stageHeight: _stageHeight /*, images*/ },
    ref,
  ) => {
    const activeMetadata = useSelector(selectActiveMetadata)!;
    const activeImage = useSelector(selectActiveImage)!;
    const dispatch = useDispatch();
    const [htmlImages, setHtmlImages] = useState<HTMLImageElement[]>([]);

    const [filters] = useState<Array<any>>();
    const imagePosition = useSelector(selectImageOrigin);
    useEffect(() => {
      console.log(activeImage);
    }, [activeImage]);
    useLayoutEffect(() => {
      if (!activeMetadata || !activeMetadata.activeSrcs) return;
      if (activeMetadata.activeSrcs.length === 1) {
        const imgElem = document.createElement("img");
        imgElem.src = activeMetadata.activeSrcs[0];
        setHtmlImages([imgElem]);
      } else {
        setHtmlImages(
          activeMetadata!.activeSrcs.map((src: string) => {
            const imgElem = document.createElement("img");
            imgElem.src = src;
            return imgElem;
          }),
        );
      }
    }, [activeMetadata, /*stageRef,*/ dispatch]);

    return (
      <>
        {htmlImages.map((image, idx) => (
          <MemoizedKonvaImage
            image={image}
            // 100 for no particular reason; shouldn't happen
            height={activeImage?.shape.height || 100}
            width={activeImage?.shape.width || 100}
            imagePosition={imagePosition!}
            visible={
              activeMetadata.activeSrcs.length === 1
                ? true
                : activeMetadata.activePlane === idx
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
  visible: boolean;
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
        visible={props.visible}
        position={props.imagePosition}
        key={props.idx}
      />
    );
  }),
);
