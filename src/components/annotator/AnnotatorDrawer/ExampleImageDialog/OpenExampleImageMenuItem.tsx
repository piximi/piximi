import { batch, useDispatch, useSelector } from "react-redux";

import { ListItem, ListItemText, Typography } from "@mui/material";

import { projectSlice } from "store/project";
import { activeImageIdSelector, AnnotatorSlice } from "store/annotator";

import { SerializedFileType } from "types";

import { loadExampleImage } from "utils/common/image";

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

  const activeImageId = useSelector(activeImageIdSelector);

  const openExampleImage = async () => {
    onClose();

    const { image, categories } = await loadExampleImage(
      exampleImageProject.exampleImageData,
      exampleImageProject.exampleImageAnnotationsFile as SerializedFileType,
      exampleImageProject.exampleImageName
    );

    // TODO: BIG_MERGE - check if this is still correct
    dispatch(projectSlice.actions.addAnnotationCategories({ categories }));
    batch(() => {
      dispatch(
        AnnotatorSlice.actions.addImages({
          newImages: [image],
        })
      );
      dispatch(
        AnnotatorSlice.actions.setActiveImage({
          imageId: image.id,
          prevImageId: activeImageId,
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
