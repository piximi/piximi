import React from "react";
import List from "@material-ui/core/List";
import { NewClassifierListItem } from "../NewClassifierListItem/NewClassifierListItem";
import { OpenListItem } from "../OpenListItem/OpenListItem";
import { SaveListItem } from "../SaveListItem/SaveListItem";

export const FileList = () => {
  return (
    <List dense>
      <NewClassifierListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
