import { Switch, styled } from "@mui/material";

type IconSwitchProps = {
  disable_icon: string;
  enable_icon: string;
};

// source: https://mui.com/components/switches/
export const IconSwitch = styled(Switch)<IconSwitchProps>(
  ({ theme, disable_icon, enable_icon }) => ({
    width: 62,
    height: 34,
    padding: 7,
    "& .MuiSwitch-switchBase": {
      margin: 1,
      padding: 0,
      transform: "translateX(6px)",
      "&.Mui-checked": {
        color: "#fff",
        transform: "translateX(22px)",
        "& .MuiSwitch-thumb:before": {
          backgroundImage: `url(${disable_icon})`,
        },
        "& + .MuiSwitch-track": {
          opacity: 1,
          backgroundColor:
            theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
        },
      },
    },
    "& .MuiSwitch-thumb": {
      backgroundColor: theme.palette.mode === "dark" ? "#003892" : "#001e3c",
      width: 32,
      height: 32,
      "&:before": {
        content: "''",
        position: "absolute",
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundImage: `url(${enable_icon})`,
      },
    },
    "& .MuiSwitch-track": {
      opacity: 1,
      backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
      borderRadius: 20 / 2,
    },
  }),
);

type CustomSwitchProps = {
  disable_icon?: string;
  enable_icon?: string;
  width?: number;
  height?: number;
};

export const CustomSwitch = styled(Switch)<CustomSwitchProps>(({
  theme,
  width = 62,
  height = 34,
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
        color: "#fff",
        transform: `translateX(${maxX}px)`,

        "& + .MuiSwitch-track": {
          opacity: 0.5,
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.primary.main
              : theme.palette.primary.main,
        },
      },
    },
    "& .MuiSwitch-thumb": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.primary.main
          : theme.palette.primary.main,
      width: thumbWidth,
      height: thumbWidth,
    },
    "& .MuiSwitch-track": {
      opacity: 0.5,
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.primary.main
          : theme.palette.primary.main,
      borderRadius: radius,
    },
  };
});
