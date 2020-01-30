import * as React from "react";
import {ListItemText, MenuItem} from "@material-ui/core";
import * as types from "@piximi/types";

export const OpenProjectMenuItem = (props: any) => {
  const {closeMenu, openClassifier} = props;

  const onChange = (e: any) => {
    const reader = new FileReader();

    reader.readAsText(e.target.files[0], "UTF-8");

    reader.onload = (e) => {
      const target = e.target as FileReader;

      const classifier = JSON.parse(target.result as string) as types.Project;

      openClassifier(classifier.categories, classifier.images, classifier.name);
    };
    closeMenu();
  };

  return (
    <React.Fragment>
      <input
        accept=".piximi"
        id="open-classifier"
        name="file"
        onChange={onChange}
        style={{display: "none"}}
        type="file"
      />

      <label htmlFor="open-project">
        <MenuItem>
          <ListItemText primary="Open project" />
        </MenuItem>
      </label>
    </React.Fragment>
  );
};
