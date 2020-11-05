import React from "react";
import List from "@material-ui/core/List";
import { NewClassifierListItem } from "../NewClassifierListItem";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";

export const FileList = () => {
  return (
    <React.Fragment>
      <List dense>
        <NewClassifierListItem />

        <OpenListItem />

        <SaveListItem />
      </List>
    </React.Fragment>
  );
};
