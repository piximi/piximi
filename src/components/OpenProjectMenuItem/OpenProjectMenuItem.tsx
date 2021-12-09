import React from "react";
import { useDispatch } from "react-redux";
import { ListItemText, MenuItem } from "@mui/material";
import { classifierSlice, projectSlice } from "../../store/slices";

type OpenExampleProjectMenuItemProps = {
  popupState: any;
};

export const OpenProjectMenuItem = ({
  popupState,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const onOpenProjectFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    close: () => void
  ) => {
    popupState.close();
    event.persist();

    close();

    if (!event.currentTarget.files) return;

    const file = event.currentTarget.files[0];

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target && event.target.result) {
        const project = JSON.parse(event.target.result as string);

        //Open project
        dispatch(
          projectSlice.actions.openProject({
            images: project.project.serializedImages,
            categories: project.project.categories,
            name: project.project.name,
          })
        );

        //Open Classifier options
        dispatch(
          classifierSlice.actions.setClassifier({
            classifier: project.classifier,
          })
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open project file" />
      <input
        accept="application/json"
        hidden
        id="open-project-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onOpenProjectFile(event, popupState.close)
        }
        type="file"
      />
    </MenuItem>
  );
};
