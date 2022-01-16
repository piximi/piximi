import React from "react";
import { useMenu } from "../../hooks";
import { UploadMenu } from "../UploadMenu";
import { Button, Tooltip } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

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
          startIcon={<CloudUploadIcon />}
        >
          Open image
        </Button>
      </Tooltip>

      <UploadMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
