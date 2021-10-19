import * as React from "react";
import { Slider } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

export const DialogTransition = React.forwardRef<unknown, TransitionProps>(
  function Transition(props, ref) {
    // @ts-ignore
    return <Slider direction="right" ref={ref} {...props} />;
  }
);
