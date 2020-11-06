import React from "react";
import List from "@material-ui/core/List";
import { NewClassifierListItem } from "../NewClassifierListItem";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";

export const FileList = () => {
  return (
    <List dense>
      <NewClassifierListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
