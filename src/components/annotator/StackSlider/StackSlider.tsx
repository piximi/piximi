import { Slider, Typography } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImageSelector } from "../../../store/selectors/activeImageSelector";
import { imageViewerSlice } from "../../../store/slices";

export const StackSlider = () => {
  const activeImage = useSelector(activeImageSelector);
  const dispatch = useDispatch();

  const [value, setValue] = useState(activeImage?.activePlane);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      setValue(newValue);
      const src = activeImage.originalSrc[newValue - 1];
      dispatch(imageViewerSlice.actions.setImageSrc({ src: src }));
    }
  };

  return (
    <React.Fragment>
      <Typography id="non-linear-slider" gutterBottom>
        Z plane: {value}
      </Typography>
      <Slider
        aria-label="z-plane"
        onChange={handleChange}
        value={value}
        valueLabelDisplay="auto"
        step={1}
        marks
        min={1}
        max={activeImage!.shape.planes}
      />
    </React.Fragment>
  );
};
