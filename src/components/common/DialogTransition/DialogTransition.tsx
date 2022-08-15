import * as React from "react";

import { Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

export const DialogTransition = React.forwardRef<unknown, TransitionProps>(
  function Transition(props: any, ref: any) {
    return <Slide direction="right" ref={ref} {...props} />;
  }
);
