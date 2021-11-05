import { Button, Divider, List, ListItem } from "@mui/material";
import React from "react";
import { ClassifierOptionsIcons } from "../ClassifierOptionsIcons";
import { UploadClassifier } from "../UploadClassifier";

export const ClassifierOptions = () => {
  return (
    <>
      <ClassifierOptionsIcons />

      <Divider />

      <UploadClassifier></UploadClassifier>
    </>
  );
};
