import React, { CSSProperties } from "react";
import { useSelector } from "react-redux";
import {
  selectImageSelectionColor,
  selectSelectedImageBorderWidth,
  selectTextOnScroll,
} from "store/applicationSettings/selectors";

export const useGridItemStyle = (selected: boolean) => {
  const imageSelectionColor = useSelector(selectImageSelectionColor);
  const selectedImageBorderWidth = useSelector(selectSelectedImageBorderWidth);
  const textOnScroll = useSelector(selectTextOnScroll);
  const containerStyle: CSSProperties = {
    position: "relative",
    boxSizing: "content-box",
    border: `solid ${selectedImageBorderWidth}px ${
      selected ? imageSelectionColor : "transparent"
    }`,
    margin: `${10 - selectedImageBorderWidth}px`,
    borderRadius: selectedImageBorderWidth + "px",
    width: "var(--item-size)",
    height: "var(--item-size)",
  };
  return { containerStyle, textOnScroll };
};
