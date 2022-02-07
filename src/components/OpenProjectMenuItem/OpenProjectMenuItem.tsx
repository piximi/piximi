import React from "react";
import { useDispatch } from "react-redux";
import { ListItemText, MenuItem } from "@mui/material";
import {
  applicationSlice,
  classifierSlice,
  projectSlice,
} from "../../store/slices";
import { SerializedProjectType } from "types/SerializedProjectType";
import { Classifier } from "types/Classifier";
import { deserializeImages } from "image/imageHelper";

type OpenProjectMenuItemProps = {
  popupState: any;
};

export const OpenProjectMenuItem = ({
  popupState,
}: OpenProjectMenuItemProps) => {
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
        const projectJSON = JSON.parse(event.target.result as string);
        const project: SerializedProjectType = projectJSON.project;
        const classifier: Classifier = projectJSON.classifier;
        const images = await deserializeImages(project.serializedImages);

        try {
          dispatch(applicationSlice.actions.clearSelectedImages());

          //Open project
          dispatch(
            projectSlice.actions.openProject({
              images: images,
              categories: project.categories,
              name: project.name,
            })
          );

          //Open Classifier options
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            })
          );
        } catch (err) {
          const error: Error = err as Error;
          alert(
            "Error while opening the project file: " +
              error.name +
              "\n" +
              error.message
          );
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open project" />
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
