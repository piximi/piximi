import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";

import { Box, Divider, IconButton, Slider } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

import { DIMENSIONS } from "utils/constants";

type IncrementalSliderProps = {
  min: number;
  max: number;
  step: number;
  initialValue?: number;
  orientation?: "horizontal" | "vertical";
  length?: CSSProperties["width"];
  callback: (value: number) => void;
  callbackOnSlide?: boolean;
  outerStyle?: CSSProperties;
};
export const IncrementalSlider = ({
  min,
  max,
  step,
  initialValue = 1,
  length,
  callback,
  orientation = "horizontal",
  callbackOnSlide = false,
  outerStyle,
}: IncrementalSliderProps) => {
  const [value, setValue] = useState<number>(initialValue);
  const [valueLabelDisplay, setvalueLabelDisplay] = useState<
    "auto" | "on" | "off"
  >("auto");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sliderLength = useMemo(() => {
    if (length) return length;
    return (max - min) * 10 + "px";
  }, [max, min, length]);

  const containerStyle: CSSProperties = useMemo(() => {
    return orientation === "horizontal"
      ? {
          flexDirection: "row",
          alignItems: "center",
          height: DIMENSIONS.toolDrawerWidth,
          ...outerStyle,
        }
      : {
          flexDirection: "column",
          alignItems: "center",
          width: DIMENSIONS.toolDrawerWidth,
          ...outerStyle,
        };
  }, [orientation]);
  const sliderStyle: CSSProperties = useMemo(() => {
    return orientation === "horizontal"
      ? {
          width: sliderLength,
          my: 0,
          mx: 1,
        }
      : {
          height: sliderLength,
          my: 1,
          mx: 0,
        };
  }, [orientation, sliderLength]);

  const handleSliderChange = (newValue: number | number[]) => {
    setValue(newValue as number);
    callbackOnSlide && callback(newValue as number);
  };

  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    setValue(newValue);
    callback(newValue);
    setvalueLabelDisplay("on");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setvalueLabelDisplay("auto"), 500);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    setValue(newValue);
    callback(newValue);
    setvalueLabelDisplay("on");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setvalueLabelDisplay("auto"), 500);
  };
  return (
    <Box
      display="flex"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "8px",
        ...containerStyle,
      })}
    >
      <IconButton
        onClick={orientation === "horizontal" ? handleDecrease : handleIncrease}
        sx={{ p: 0, m: "0.25rem" }}
      >
        {orientation === "horizontal" ? (
          <Remove sx={{ fontSize: "1rem" }} />
        ) : (
          <Add sx={{ fontSize: "1rem" }} />
        )}
      </IconButton>
      <Divider
        orientation={orientation === "horizontal" ? "vertical" : "horizontal"}
        flexItem
      />
      <Slider
        orientation={orientation}
        value={value}
        min={min}
        max={max}
        step={step}
        size={"small"}
        valueLabelDisplay={valueLabelDisplay}
        onChange={(_, value) => handleSliderChange(value as number)}
        onChangeCommitted={(_, value) => {
          if (callbackOnSlide) return;
          callback(value as number);
        }}
        sx={(theme) => ({
          " & .MuiSlider-thumb.Mui-focusVisible, .MuiSlider-thumb:hover": {
            boxShadow: "none",
          },
          "& .MuiSlider-valueLabel": {
            fontSize: 12,
            paddingY: 0,
            paddingX: 0.5,
            fontWeight: "normal",
            top: orientation === "vertical" ? 6 : -6,
            backgroundColor: `rgba(${theme.palette.background.defaultChannel} / 0.75)`,
            color: theme.palette.text.primary,
            "&::before": {
              display: "none",
            },
            "& *": {
              background: "transparent",
              color: "#000",
              ...theme.applyStyles("dark", {
                color: "#fff",
              }),
            },
          },

          ...sliderStyle,
        })}
      />
      <Divider
        orientation={orientation === "horizontal" ? "vertical" : "horizontal"}
        flexItem
      />
      <IconButton
        onClick={orientation === "horizontal" ? handleIncrease : handleDecrease}
        sx={{ p: 0, m: "0.25rem" }}
      >
        {orientation === "horizontal" ? (
          <Add sx={{ fontSize: "1rem" }} />
        ) : (
          <Remove sx={{ fontSize: "1rem" }} />
        )}
      </IconButton>
    </Box>
  );
};
