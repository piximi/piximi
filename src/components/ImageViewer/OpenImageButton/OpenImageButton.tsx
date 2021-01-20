import React from "react";
import { useStyles } from "./OpenImageButton.css";
import { Button } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Tooltip from "@material-ui/core/Tooltip";
import { Shape } from "../../../types/Shape";
import { createImage } from "../../../store/slices";
import { useDispatch } from "react-redux";

export const OpenImageButton = () => {
  const dispatch = useDispatch();

  const classes = useStyles();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();

    if (event.currentTarget.files) {
      const blob = event.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const src = event.target.result;

          const image = new Image();

          image.onload = () => {
            const shape: Shape = {
              r: image.naturalHeight,
              c: image.naturalWidth,
              channels: 4,
            };

            dispatch(createImage({ shape: shape, src: src as string }));
          };

          image.src = src as string;
        }
      };

      reader.readAsDataURL(blob);
    }
  };

  return (
    <React.Fragment>
      <div>
        <input
          accept="image/*"
          hidden
          type="file"
          id="open-image"
          onChange={onChange}
        />

        <Tooltip title="Open image">
          <label htmlFor="open-image">
            <Button className={classes.button} startIcon={<CloudUploadIcon />}>
              Open image
            </Button>
          </label>
        </Tooltip>
      </div>
    </React.Fragment>
  );
};
