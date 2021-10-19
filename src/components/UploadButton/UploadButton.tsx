import React from "react";
import { useStyles } from "./UploadButton.css";
import { useMenu } from "../../hooks";
import { UploadMenu } from "../UploadMenu";
import { Button, Tooltip } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export const UploadButton = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  const classes = useStyles();

  return (
    <>
      <Tooltip title="Open image">
        <Button
          className={classes.button}
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
