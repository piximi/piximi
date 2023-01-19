import { batch, useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import { ListItem, ListItemText, Typography } from "@mui/material";

import {
  annotationCategoriesSelector,
  setAnnotationCategories,
} from "store/project";
import { imageViewerSlice, setActiveImage } from "store/image-viewer";

import { AnnotationType } from "types";

// TODO: image_data
import {
  _SerializedFileType,
  _SerializedAnnotationType,
} from "format_convertor/types";

// TODO: image_data
import {
  generateDefaultChannels,
  importSerializedAnnotations,
} from "image/imageHelper";
import { convertToImage, loadDataUrlAsStack } from "image/utils/imageHelper";

type ExampleImageProject = {
  exampleImageName: string;
  exampleImageData: any;
  exampleImageDescription: string;
  exampleImageAnnotations: Array<_SerializedFileType>;
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

  const annotationCategories = useSelector(annotationCategoriesSelector);

  const openExampleImage = async () => {
    onClose();

    const serializedExampleImageFile =
      exampleImageProject.exampleImageAnnotations[0];

    const defaultColors = generateDefaultChannels(
      serializedExampleImageFile.imageChannels
    );

    const exampleImageSrc = exampleImageProject.exampleImageData as string;
    const exampleImage = await loadDataUrlAsStack(exampleImageSrc);
    const exampleImageTypeObject = convertToImage(
      //@ts-ignore TODO: image_data
      [exampleImage],
      exampleImageProject.exampleImageName,
      defaultColors,
      serializedExampleImageFile.imagePlanes,
      serializedExampleImageFile.imageChannels
    );

    serializedExampleImageFile.imageId = uuidv4();
    serializedExampleImageFile.imageSrc = exampleImageSrc;
    // @ts-ignore TODO: image_Data
    serializedExampleImageFile.imageData = exampleImageTypeObject.originalSrc;

    batch(() => {
      let updatedAnnotationCategories = annotationCategories;
      const annotations = serializedExampleImageFile.annotations.map(
        (annotation: _SerializedAnnotationType): AnnotationType => {
          const { annotation_out, categories } = importSerializedAnnotations(
            annotation,
            updatedAnnotationCategories
          );
          updatedAnnotationCategories = categories;
          return annotation_out;
        }
      );

      dispatch(
        imageViewerSlice.actions.openAnnotations({
          imageFile: serializedExampleImageFile,
          annotations: annotations,
        })
      );

      dispatch(
        setAnnotationCategories({
          categories: updatedAnnotationCategories,
        })
      );

      dispatch(
        setActiveImage({
          imageId: serializedExampleImageFile.imageId,
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
            {exampleImageProject.exampleImageName}
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
