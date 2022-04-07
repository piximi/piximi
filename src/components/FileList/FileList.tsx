import React from "react";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";
import { List } from "@mui/material";
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
