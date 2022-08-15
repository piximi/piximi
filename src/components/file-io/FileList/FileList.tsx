import React from "react";

import { List } from "@mui/material";

import { NewProjectListItem } from "../NewProjectListItem";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
