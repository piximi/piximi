import React from "react";

import { List } from "@mui/material";

import { OpenListItem } from "components/OpenListItem";
import { SaveListItem } from "components/SaveListItem";
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
