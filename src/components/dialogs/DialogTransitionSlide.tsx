import { forwardRef } from "react";

import { Slide } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";

export const DialogTransitionSlide = forwardRef<unknown, TransitionProps>(
  function Transition(props: any, ref: any) {
    return <Slide direction="right" ref={ref} {...props} />;
  },
);
