import { batch, useDispatch, useSelector } from "react-redux";

import { ListItem, ListItemText, Typography } from "@mui/material";

import { dataSlice } from "store/data";
import { selectActiveImageId, imageViewerSlice } from "store/imageViewer";
import { projectSlice } from "store/project";

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

  const activeImageId = useSelector(selectActiveImageId);

  const openExampleImage = async () => {
    onClose();

    const { image, annotations, annotationCategories } = await loadExampleImage(
      exampleImageProject.exampleImageData,
      exampleImageProject.exampleImageAnnotationsFile as SerializedFileType,
      exampleImageProject.exampleImageName
    );

    batch(() => {
      dispatch(
        dataSlice.actions.initData({
          images: [image],
          annotations: annotations,
          annotationCategories: annotationCategories,
          categories: [],
        })
      );

      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: image.id,
          prevImageId: activeImageId,
          execSaga: true,
        })
      );
      dispatch(projectSlice.actions.selectImage({ imageId: image.id }));
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
