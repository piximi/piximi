import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import { useStyles } from "../Application/Application.css";
import { useDispatch } from "react-redux";
import { createProject } from "../../store/slices";

type OpenProjectMenuItemProps = {
  onClose: () => void;
};

export const OpenProjectMenuItem = ({ onClose }: OpenProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const classes = useStyles();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onClose();

    event.persist();

    if (event.currentTarget.files) {
      const blob = event.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          const src = event.target.result;

          dispatch(
            createProject({ project: JSON.parse(src as string).project })
          );
        }
      };

      reader.readAsText(blob);
    }
  };

  return (
    <React.Fragment>
      <input
        accept="application/json"
        className={classes.fileInput}
        id="open-project"
        onChange={onChange}
        type="file"
      />

      <label htmlFor="open-project">
        <MenuItem onClick={onClose}>Open project</MenuItem>
      </label>
    </React.Fragment>
  );
};
