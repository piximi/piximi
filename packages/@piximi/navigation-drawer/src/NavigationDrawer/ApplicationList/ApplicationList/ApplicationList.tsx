import * as React from "react";
import {ConnectedOpenListItem} from "../OpenListItem/OpenListItem";
import {NewProjectListItem} from "../NewProjectListItem";
import {ConnectedSaveListItem} from "../SaveListItem/SaveListItem";
import {List, Paper} from "@material-ui/core";

export const ApplicationList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <ConnectedOpenListItem />

      <ConnectedSaveListItem />
    </List>
  );
};
