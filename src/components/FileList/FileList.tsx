import React from "react";

import { List } from "@mui/material";

import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";

import { NewProjectListItem } from "components/NewProjectListItem";

export const FileList = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenListItem />

      <SaveListItem />
    </List>
  );
};
