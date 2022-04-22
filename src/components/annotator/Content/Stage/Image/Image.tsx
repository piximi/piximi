import * as ReactKonva from "react-konva";
import React, { useEffect, useState } from "react";
import useImage from "use-image";
import Konva from "konva";
import { useSelector } from "react-redux";
import { boundingClientRectSelector } from "../../../../../store/selectors";
import { scaledImageWidthSelector } from "../../../../../store/selectors/scaledImageWidthSelector";
import { scaledImageHeightSelector } from "../../../../../store/selectors/scaledImageHeightSelector";
import { imageSrcSelector } from "../../../../../store/selectors/imageSrcSelector";

export const Image = React.forwardRef<Konva.Image>((_, ref) => {
  const src = useSelector(imageSrcSelector);

  const width = useSelector(scaledImageWidthSelector);

  const height = useSelector(scaledImageHeightSelector);

  const [image] = useImage(src ? src : "", "anonymous");

  const [filters, setFilters] = useState<Array<any>>();

  const boundingClientRect = useSelector(boundingClientRectSelector);

  const normalizeFont = 1300;

  // useEffect(() => {
  //   // @ts-ignore
  //   if (!ref || !ref.current) return;
  //   const defaultChannels: Array<ChannelType> = []; //number of channels depends on whether image is greyscale or RGB
  //   for (let i = 0; i < channels.length; i++) {
  //     defaultChannels.push({
  //       range: [0, 255],
  //       visible: true,
  //     });
  //   }
  //   if (isEqual(channels, defaultChannels)) {
  //     setFilters([]);
  //     // @ts-ignore
  //     ref?.current.clearCache();
  //   } else {
  //     const IntensityFilter = createIntensityFilter(channels);
  //     setFilters([IntensityFilter]);
  //     // @ts-ignore
  //     ref?.current.cache();
  //   }
  // }, [channels, stageScale, ref]);

  useEffect(() => {
    // @ts-ignore
    if (!ref || !ref.current) return;
    setFilters([]);
    // @ts-ignore
    ref?.current.clearCache();
  }, [image, ref]);

  if (!src) {
    return (
      <>
        <ReactKonva.Text
          x={
            boundingClientRect.x +
            (80 * boundingClientRect.width) / normalizeFont
          } //center depending on window width
          y={0.4 * boundingClientRect.height}
          text={
            'To start annotating, drag and drop an image onto the canvas or click on "Open Image".'
          }
          fill={"white"}
          fontSize={(30 * boundingClientRect.width) / normalizeFont} //scale font depending on window width
        />
      </>
    );
  }

  return (
    <>
      <ReactKonva.Image
        height={height}
        image={image}
        ref={ref}
        width={width}
        filters={filters}
      />
    </>
  );
});
