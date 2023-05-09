import React from "react";

import { List } from "@mui/material";

import { NewProjectListItem } from "../list-items/NewProjectListItem";
import { OpenListItem } from "../list-items/OpenListItem";
import { SaveListItem } from "../list-items/SaveListItem";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
