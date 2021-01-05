import React from "react";
import { useStyles } from "./UploadButton.css";
import { Button } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Tooltip from "@material-ui/core/Tooltip";
import { useMenu } from "../../hooks";
import { UploadMenu } from "../UploadMenu";

export const UploadButton = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  const classes = useStyles();

  return (
    <React.Fragment>
      <Tooltip title="Upload images">
        <Button
          className={classes.button}
          onClick={onOpen}
          startIcon={<CloudUploadIcon />}
        >
          Upload
        </Button>
      </Tooltip>

      <UploadMenu anchorEl={anchorEl!.current} onClose={onClose} open={open} />
    </React.Fragment>
  );
};
