import React from "react";

import { Popover } from "@mui/material";

import { useInformationPopover } from "./InformationPopoverProvider";
import { ImagePopoverContent, AnnotationPopoverContent } from "./tables";

export const InformationPopover = () => {
  const { state, close } = useInformationPopover();
  if (state.anchorEl === null) return null;
  return (
    <Popover
      open={!!state.anchorEl}
      onClick={(e) => e.stopPropagation()}
      anchorEl={state.anchorEl}
      onClose={close}
      anchorOrigin={{
        vertical: "center",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "center",
        horizontal: "left",
      }}
    >
      {state.itemType === "image" ? (
        <ImagePopoverContent itemId={state.itemId} onMissing={close} />
      ) : (
        <AnnotationPopoverContent itemId={state.itemId} onMissing={close} />
      )}
    </Popover>
  );
};
