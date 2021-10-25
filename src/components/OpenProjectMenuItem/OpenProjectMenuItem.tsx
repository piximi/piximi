import React from "react";
import { useDispatch } from "react-redux";
import { ListItemText, MenuItem } from "@mui/material";
import { projectSlice } from "../../store/slices";
import { SerializedImageType } from "../../types/SerializedImageType";

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
    event.persist();

    close();

    if (!event.currentTarget.files) return;

    const file = event.currentTarget.files[0];

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target && event.target.result) {
        //Open project (images, categories)
        const project = JSON.parse(event.target.result as string);

        dispatch(
          projectSlice.actions.openImages({
            images: project.project.serializedImages,
          })
        );

        dispatch(
          projectSlice.actions.setCategories({
            categories: project.project.categories,
          })
        );
        dispatch(
          projectSlice.actions.setProjectName({ name: project.project.name })
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
