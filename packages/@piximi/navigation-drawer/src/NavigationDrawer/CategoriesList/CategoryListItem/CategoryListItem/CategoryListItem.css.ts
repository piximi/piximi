import {keyframes} from "styled-components";
import Color from "color";
import {createStyles} from "@material-ui/core/styles";

export const styles = () =>
  createStyles({
    icon: {
      color: "rgba(0,0,0,0.50)",
      cursor: "pointer",
      "&:hover": {
        color: "rgba(0,0,0,0.87)"
      }
    },
    isOver: {
      background: "rgba(0, 0, 0, 0.20)"
    }
  });

export const pulseAnimation = (color: any) => {
  return keyframes`
  0% {
    box-shadow: 0px 0px 0px 0px ${Color(color)
      .alpha(0.3)
      .string()};
  }
  10% {
    background-color: ${Color(color)
      .alpha(0.3)
      .string()};
  }
  70% {
    background-color: ${Color(color)
      .alpha(0)
      .string()};
    box-shadow: 0px 0px 15px 15px ${Color(color)
      .alpha(0.0)
      .string()};
  }
  100% {
    box-shadow: 0px 0px 0px 0px ${Color(color)
      .alpha(0.0)
      .string()};
  }
`;
};

export const pulseAnimation2 = (color: any) => {
  return keyframes`
  0% {
    box-shadow: 0px 0px 0px 0px ${Color(color)
      .alpha(0.3)
      .string()};
  }
  10% {
    background-color: ${Color(color)
      .alpha(0.3)
      .string()};
  }
  70% {
    background-color: ${Color(color)
      .alpha(0)
      .string()};
    box-shadow: 0px 0px 16px 16px ${Color(color)
      .alpha(0.0)
      .string()};
  }
  100% {
    box-shadow: 0px 0px 0px 0px ${Color(color)
      .alpha(0.0)
      .string()};
  }
`;
};
