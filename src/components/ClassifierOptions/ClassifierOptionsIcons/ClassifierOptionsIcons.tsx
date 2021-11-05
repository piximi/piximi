import { IconButton, Tooltip } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import React from "react";
import { useStyles } from "../ClassifierOptions/ClassifierOptions.css";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export const ClassifierOptionsIcons = () => {
  const classes = useStyles();

  return (
    <>
      <div className={classes.icons}>
        <Tooltip title={"upload classifier"}>
          <IconButton>
            <UploadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={"architecture"}>
          <IconButton disabled>
            <AutoAwesomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={"optimizer"}>
          <IconButton disabled>
            <AutoAwesomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={"apply classifier"}>
          <IconButton>
            <PlayArrowIcon />
          </IconButton>
        </Tooltip>
      </div>
    </>
  );
};
