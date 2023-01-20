import { batch, useDispatch } from "react-redux";

import { ListItem, ListItemText, Typography } from "@mui/material";

import { projectSlice } from "store/project";
import { imageViewerSlice } from "store/image-viewer";

import { SerializedFileType } from "types";

import { loadExampleImage } from "image/utils/loadExampleImage";

type ExampleImageProject = {
  exampleImageTitle: string;
  exampleImageName?: string;
  exampleImageData: any;
  exampleImageDescription: string;
  exampleImageAnnotationsFile: SerializedFileType;
  projectSource: {
    sourceName: string;
    sourceUrl: string;
  };
  license?: {
    licenseName: string;
    licenseUrl: string;
  };
};

type OpenExampleImageMenuItemProps = {
  exampleImageProject: ExampleImageProject;
  onClose: any;
};

export const OpenExampleImageMenuItem = ({
  exampleImageProject,
  onClose,
}: OpenExampleImageMenuItemProps) => {
  const dispatch = useDispatch();

  const openExampleImage = async () => {
    onClose();

    const { image, categories } = await loadExampleImage(
      exampleImageProject.exampleImageData,
      exampleImageProject.exampleImageAnnotationsFile as SerializedFileType,
      exampleImageProject.exampleImageName
    );

    dispatch(projectSlice.actions.addAnnotationCategories({ categories }));
    batch(() => {
      dispatch(
        imageViewerSlice.actions.addImages({
          newImages: [image],
        })
      );
      dispatch(
        imageViewerSlice.actions.setActiveImage({
          imageId: image.id,
          execSaga: true,
        })
      );
    });
  };

  return (
    <ListItem button onClick={openExampleImage}>
      <ListItemText
        primary={
          <Typography component="span" variant="subtitle1">
            {exampleImageProject.exampleImageTitle}
          </Typography>
        }
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              style={{ whiteSpace: "pre-line" }}
            >
              {exampleImageProject.exampleImageDescription}
            </Typography>

            <br></br>

            {"Source: "}
            <a
              href={exampleImageProject.projectSource.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {exampleImageProject.projectSource.sourceName}
            </a>

            {exampleImageProject.license && (
              <>
                {" License: "}
                <a
                  href={exampleImageProject.license.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {exampleImageProject.license.licenseName}
                </a>
              </>
            )}
          </>
        }
      />
    </ListItem>
  );
};
