import React from "react";

import { Button, Tooltip } from "@mui/material";
import { AddPhotoAlternate as AddPhotoAltIcon } from "@mui/icons-material";

import { useMenu } from "hooks";

import { UploadMenu } from "../UploadMenu";

export const UploadButton = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <Tooltip title="Open image">
        <Button
          sx={{
            margin: (theme) => theme.spacing(1),
            textTransform: "none",
          }}
          onClick={onOpen}
          startIcon={<AddPhotoAltIcon />}
        >
          Open image
        </Button>
      </Tooltip>

      <UploadMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
