import React from "react";
import { ListItemText, MenuItem } from "@mui/material";
import { classifierSlice } from "../../store/slices";
import * as tf from "@tensorflow/tfjs";
import { useDispatch } from "react-redux";

type OpenClassifierMenuItemProps = {
  //onClose: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  popupState: any;
};

export const OpenClassifierMenuItem = ({
  //onClose,
  popupState,
}: OpenClassifierMenuItemProps) => {
  const dispatch = useDispatch();

  const onOpenClassifierClick = async (
    event: React.ChangeEvent<HTMLInputElement>,
    close: () => void
  ) => {
    popupState.close();
    event.persist();

    close();

    if (!event.currentTarget.files) return;

    let weightsFile, jsonFile;
    // TODO #131 Check that that correct files were selected (one .bin, one .json -- throw error if not). Make sure to add instructions for user.
    // Allow user to open either a project or classifier or both.

    if (event.currentTarget.files[0].name.includes(".bin")) {
      weightsFile = event.currentTarget.files[0];
      jsonFile = event.currentTarget.files[1];
    } else {
      weightsFile = event.currentTarget.files[1];
      jsonFile = event.currentTarget.files[0];
    }

    const model = await tf.loadLayersModel(
      tf.io.browserFiles([jsonFile, weightsFile])
    );

    dispatch(classifierSlice.actions.updateOpened({ opened: model }));
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open classifier" />
      <input
        accept="application/json|.bin"
        hidden
        multiple
        id="open-project-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onOpenClassifierClick(event, popupState.close)
        }
        type="file"
      />
    </MenuItem>
  );
};
