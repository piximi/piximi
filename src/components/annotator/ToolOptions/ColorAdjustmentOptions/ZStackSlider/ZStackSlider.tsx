import { List, ListItem, ListItemText, Slider } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { activeImageSelector } from "../../../../../store/selectors/activeImageSelector";
import { imageViewerSlice } from "../../../../../store/slices";
import {
  convertImageURIsToImageData,
  mapChannelstoSpecifiedRGBImage,
} from "../../../../../image/imageHelper";
import { activeImageColorsSelector } from "../../../../../store/selectors/activeImageColorsSelector";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";

export const ZStackSlider = () => {
  const activeImagePlane = useSelector(activeImagePlaneSelector);
  const activeImage = useSelector(activeImageSelector);
  const dispatch = useDispatch();
  const channels = useSelector(activeImageColorsSelector);

  const [value, setValue] = useState(activeImagePlane);

  const originalSrc = useSelector(imageOriginalSrcSelector);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      if (!originalSrc) return;

      setValue(newValue);

      const planeData = await convertImageURIsToImageData([
        originalSrc[newValue],
      ]);

      const imageSrc = mapChannelstoSpecifiedRGBImage(
        planeData[0],
        channels,
        activeImage.shape.height,
        activeImage.shape.width
      );

      dispatch(
        imageViewerSlice.actions.setImageSrc({
          src: imageSrc,
        })
      );
      dispatch(
        imageViewerSlice.actions.setActiveImagePlane({
          activeImagePlane: newValue,
        })
      );

      //TODO: the below works, but I'm trying something else

      // setValue(newValue);
      // const imageData = originalData[newValue];
      //
      // const imageSrc = mapChannelstoSpecifiedRGBImage(
      //   imageData,
      //   channels,
      //   activeImage.shape.height,
      //   activeImage.shape.width
      // );
      //
      // dispatch(
      //   imageViewerSlice.actions.setImageSrc({
      //     src: imageSrc,
      //   })
      // );
      // dispatch(
      //   imageViewerSlice.actions.setActiveImagePlane({
      //     activeImagePlane: newValue,
      //   })
      // );
    }
  };

  return (
    <React.Fragment>
      <List dense>
        <ListItem>
          <ListItemText>Z plane: {value}</ListItemText>
        </ListItem>

        <ListItem>
          <Slider
            aria-label="z-plane"
            onChange={handleChange}
            value={value}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={activeImage!.shape.planes - 1}
          />
        </ListItem>
      </List>
    </React.Fragment>
  );
};
