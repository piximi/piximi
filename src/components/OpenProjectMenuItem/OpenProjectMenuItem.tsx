import React from "react";
import { useDispatch } from "react-redux";
import { ListItemText, MenuItem } from "@mui/material";
import { projectSlice } from "../../store/slices";

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

    if (!event.currentTarget.files) return;

    const file = event.currentTarget.files[0];

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target && event.target.result) {
        const project = JSON.parse(event.target.result as string);

        //update Project Slice
        dispatch(projectSlice.actions.setImages({ images: project.images }));
        debugger;
        dispatch(
          projectSlice.actions.setCategories({ categories: project.categories })
        );
        dispatch(projectSlice.actions.setProjectName({ name: project.name }));

        debugger;

        //project.project and project.classifier

        //clear all images
        // dispatch(applicationSlice.actions.setImages({ images: [] }));

        // project.forEach(
        //     (serializedImage: SerializedFileType, index: number) => {
        //       if (index === 0) {
        //         dispatch(
        //             setActiveImage({
        //               image: serializedImage.imageId,
        //             })
        //         );
        //
        //         dispatch(
        //             setSelectedAnnotations({
        //               selectedAnnotations: [],
        //               selectedAnnotation: undefined,
        //             })
        //         );
        //
        //         dispatch(
        //             setOperation({ operation: ToolType.RectangularAnnotation })
        //         );
        //       }
        //       dispatch(
        //           applicationSlice.actions.openAnnotations({
        //             file: serializedImage,
        //           })
        //       );
        //     }
        // );
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
