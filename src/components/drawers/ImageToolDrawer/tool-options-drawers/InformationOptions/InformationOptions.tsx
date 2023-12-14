import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { selectSelectedImages } from "store/slices/data";
import { ImageInformationTable } from "./ImageInformationTable";

export const InformationOptions = () => {
  const selectedImages = useSelector(selectSelectedImages);

  return selectedImages.length > 0 ? (
    <>
      {selectedImages.map((image) => (
        <ImageInformationTable
          key={`image-info-table-${image.id}`}
          image={image}
          collapsible={true}
        />
      ))}
    </>
  ) : (
    <Box display="flex" justifyContent="center">
      <Typography justifyContent="center">Select an image</Typography>
    </Box>
  );
};
