import * as MaterialUI from "@material-ui/core";
import * as React from "react";
import { TransitionProps } from "@material-ui/core/transitions";

export const DialogTransition = React.forwardRef<unknown, TransitionProps>(
  function Transition(props, ref) {
    // @ts-ignore
    return <MaterialUI.Slide direction="right" ref={ref} {...props} />;
  }
);
