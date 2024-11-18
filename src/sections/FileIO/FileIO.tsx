import React from "react";

import { List } from "@mui/material";

import { SaveProjectListItem } from "./SaveProjectListItem";
import { NewProjectListItem } from "./NewProjectListItem";
import { OpenProjectListItem } from "./OpenProjectListItem";

export const FileIO = () => {
  return (
    <List dense>
      <NewProjectListItem />

      <OpenProjectListItem />

      <SaveProjectListItem />
    </List>
  );
};
