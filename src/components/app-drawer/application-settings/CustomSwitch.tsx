import { Switch, styled } from "@mui/material";

type CustomSwitchProps = {
  disable_icon?: string;
  enable_icon?: string;
  width?: number;
  height?: number;
  persistColor?: boolean;
};

export const CustomSwitch = styled(Switch)<CustomSwitchProps>(({
  theme,
  width = 62,
  height = 34,
  persistColor = false,
}) => {
  const thumbWidth = height - 2;
  const padding = Math.round(height / 4);
  const maxX = width - height + 1;
  const radius = (height - 2 * padding) / 2;
  return {
    width: width,
    height: height,
    paddingBlock: padding,
    paddingInline: 0,
    "& .MuiSwitch-switchBase": {
      margin: 1,
      padding: 0,
      transform: "translateX(0px)",
      "&.Mui-checked": {
        transform: `translateX(${maxX}px)`,

        "& + .MuiSwitch-track": {
          opacity: 0.5,
          backgroundColor: persistColor
            ? theme.palette.primary.main
            : undefined,
        },
      },
    },
    "& .MuiSwitch-thumb": {
      backgroundColor: persistColor ? theme.palette.primary.main : undefined,
      width: thumbWidth,
      height: thumbWidth,
    },
    "& .MuiSwitch-track": {
      opacity: 0.5,
      backgroundColor: persistColor ? theme.palette.primary.main : undefined,
      borderRadius: radius,
    },
  };
});
