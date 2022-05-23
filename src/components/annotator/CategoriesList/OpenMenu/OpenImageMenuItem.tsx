import React, { useState } from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { ImageShapeDialog } from "./ImageShapeDialog";
import { useUpload } from "hooks/useUpload/useUpload";
import {
  convertToImage,
  getImageShapeInformation,
  ImageShapeEnum,
} from "image/imageHelper";
import { applicationSlice } from "store/slices";
import { useDispatch } from "react-redux";

//import dicomjs from 'dicom.ts';
import { parseImage, Renderer } from "dicom.ts";
import * as ImageJS from "image-js";

const dicomParser = require("dicom-parser");

const displayDicom = async (file: File) => {
  try {
    //loadDicomImage(files, 10000);
    const buffer = await file.arrayBuffer();
    const dataView = new DataView(buffer);

    const canvas = document.createElement("canvas");

    // get the DCM image
    const image = parseImage(dataView);

    if (!image) return;

    // create the renderer (keeping hold of an instance for the canvas can
    // improve 2nd image decode performance hugely - see examples)
    //const renderer = new Renderer(canvas);

    const test = image.pixelData.rawValue as DataView;

    canvas.width = image.rows;
    canvas.height = image.columns;
    // const ctx = canvas.getContext("2d");

    // decode, and display frame 0 on the canvas
    //await renderer.render(image, 0);

    //const ctx = canvas.getContext('2d');
    //const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    //return new Image(imageData.width, imageData.height, imageData.data);
    //const testDicom = ImageJS.Image.fromCanvas(canvas);
    const testDicom = await ImageJS.Image.load(test.buffer);

    // const imageToUpload: ImageType = await convertToImage(
    //   imageFiles[i].image,
    //   imageFiles[i].fileName,
    //   colors,
    //   slices,
    //   channels
    // );
  } catch (e) {
    console.error(e);
  }
};

// get an ArrayBuffer of the file
// const dataBuffer = ...

// // get your canvas, and ensure add to the DOM
// // dicomjs will create one if none provided
// const canvas = document.createElement("canvas");
// document.body.appendChild(canvas);

// displayDicom(canvas, dataBuffer);

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
    popupState.close();
  };

  const [files, setFiles] = useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox);
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return;
    const files: FileList = Object.assign([], event.currentTarget.files);

    if (files[0].name.endsWith("dcm")) {
      //document.body.appendChild(canvas);
      //loadDicomImage(files);

      //displayDicom(files[0]);

      return;
    }

    await uploadFiles(files);
    event.target.value = "";
    setFiles(files);
  };

  return (
    <React.Fragment>
      <MenuItem component="label">
        <ListItemText primary="Open new image" />
        <input
          accept="image/*,.dcm"
          hidden
          multiple
          id="open-image"
          onChange={onOpenImage}
          type="file"
        />
      </MenuItem>
      {files?.length && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={handleClose}
          isUploadedFromAnnotator={true}
        />
      )}
    </React.Fragment>
  );
};
