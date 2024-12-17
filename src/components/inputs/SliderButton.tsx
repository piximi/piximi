import { ReactElement, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  IconButtonProps,
  Popover,
  Slider,
  SvgIcon,
  Tooltip,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

import { useMenu } from "hooks";

export const SliderButton = ({
  min,
  max,
  step,
  title,
  icon,
  callback,
  orientation = "horizontal",
  ...rest
}: IconButtonProps & {
  min: number;
  max: number;
  step: number;
  title: string;
  icon: ReactElement;
  orientation?: "horizontal" | "vertical";
  callback: (value: number) => void;
}) => {
  const [value, setValue] = useState<number>(1);
  const { onOpen, onClose, open, anchorEl } = useMenu();

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    callback(newValue as number);
  };

  const handleDecrease = () => {
    const newValue = value - step >= min ? value - step : min;
    setValue(newValue);
    callback(newValue);
  };

  const handleIncrease = () => {
    const newValue = value + step <= max ? value + step : max;
    setValue(newValue);
    callback(newValue);
  };

  return (
    <>
      <Tooltip title={title}>
        <IconButton {...rest} color="inherit" onClick={onOpen}>
          <SvgIcon fontSize="small">{icon}</SvgIcon>
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{ paper: { sx: { borderRadius: "1rem", px: "0.5rem" } } }}
      >
        <Box
          display="flex"
          flexDirection={orientation === "horizontal" ? "row" : "column"}
          alignItems="center"
        >
          <Add fontSize={rest.size} onClick={handleIncrease} />
          <Divider
            sx={(theme) => ({
              borderColor: theme.palette.text.primary,
              mx: "0.5rem",
            })}
            orientation={
              orientation === "horizontal" ? "vertical" : "horizontal"
            }
            flexItem={orientation === "horizontal" ? true : false}
          />
          <Slider
            orientation={orientation}
            value={value}
            min={min}
            max={max}
            step={step}
            size={rest.size as "small" | "medium"}
            marks
            onChange={handleSliderChange}
            sx={{
              " & .MuiSlider-thumb.Mui-focusVisible, .MuiSlider-thumb:hover": {
                boxShadow: "none",
              },
              ...(orientation === "horizontal"
                ? { width: (max - min) * 10 + "px", my: 0, mx: 1 }
                : { height: (max - min) * 10 + "px", my: 1, mx: 0 }),
            }}
            slotProps={{ thumb: {} }}
          />
          <Divider
            sx={(theme) => ({
              borderColor: theme.palette.text.primary,
              ...(orientation === "horizontal"
                ? { mx: "0.5rem" }
                : { my: "0.5rem" }),
            })}
            orientation={
              orientation === "horizontal" ? "vertical" : "horizontal"
            }
            flexItem={orientation === "horizontal" ? true : false}
          />
          <Remove fontSize={rest.size} onClick={handleDecrease} />
        </Box>
      </Popover>
    </>
  );
};

export const VerticalSliderButton = ({
  min,
  max,
  step,
  title,
  icon,
  callback,
  disabled,
  tooltipLocation = "bottom",
}: {
  min: number;
  max: number;
  step: number;
  title: string;
  icon: ReactElement;
  callback: (value: number) => void;
  disabled?: boolean;
  tooltipLocation?: "top" | "bottom" | "left" | "right";
}) => {
  const [value, setValue] = useState<number>(1);
  const { onOpen, onClose, open, anchorEl } = useMenu();

  const handleSizeChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    callback(newValue as number);
  };

  const handleDecrease = () => {
    const newValue = value - step >= min ? value - step : min;
    setValue(newValue);
    callback(newValue);
  };

  const handleIncrease = () => {
    const newValue = value + step <= max ? value + step : max;
    setValue(newValue);
    callback(newValue);
  };

  return (
    <>
      <Tooltip title={title} placement={tooltipLocation}>
        <IconButton disabled={disabled} onClick={onOpen}>
          <SvgIcon fontSize="small">{icon}</SvgIcon>
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        slotProps={{ paper: { sx: { borderRadius: "1rem", py: "0.5rem" } } }}
      >
        <Box display="flex" flexDirection="column" alignItems="center">
          <Add fontSize="small" onClick={handleIncrease} />
          <Divider
            sx={(theme) => ({
              borderColor: theme.palette.text.primary,
              my: "0.5rem",
            })}
            flexItem
          />
          <Slider
            orientation="vertical"
            value={value}
            min={min}
            max={max}
            step={step}
            size={"small"}
            marks
            onChange={handleSizeChange}
            sx={{
              " & .MuiSlider-thumb.Mui-focusVisible, .MuiSlider-thumb:hover": {
                boxShadow: "none",
              },
              height: (max - min) * 10 + "px",
              my: 1,
              mx: 0,
            }}
            slotProps={{ thumb: {} }}
          />
          <Divider
            sx={(theme) => ({
              borderColor: theme.palette.text.primary,

              my: "0.5rem",
            })}
            flexItem
          />
          <Remove fontSize={"small"} onClick={handleDecrease} />
        </Box>
      </Popover>
    </>
  );
};
