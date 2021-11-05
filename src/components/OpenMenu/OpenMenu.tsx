import React from "react";
import { Divider, ListItemText, Menu, MenuItem, MenuList } from "@mui/material";
import { bindMenu } from "material-ui-popup-state";
import { OpenExampleProjectMenuItem } from "../OpenExampleProjectMenuItem";
import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import * as tf from "@tensorflow/tfjs";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../store/slices";

type OpenMenuProps = {
  popupState: any;
};

export const OpenMenu = ({ popupState }: OpenMenuProps) => {
  const dispatch = useDispatch();

  const onOpenClassifierClick = async (
    event: React.ChangeEvent<HTMLInputElement>,
    close: () => void
  ) => {
    event.persist();

    close();

    if (!event.currentTarget.files) return;

    let weightsFile, jsonFile;
    //TODO Check that that correct files were selected (one .bin, one .json -- throw error if not). Make sure to add instructions for user.

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

    dispatch(classifierSlice.actions.updateOpened({ opened: model })); //TODO this should also update fitted (.predict() expects a fitted model.)
  };

  return (
    <Menu {...bindMenu(popupState)}>
      <MenuList dense variant="menu">
        <OpenProjectMenuItem popupState={popupState} />
        <OpenExampleProjectMenuItem popupState={popupState} />
        <Divider />

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
      </MenuList>
    </Menu>
  );
};
