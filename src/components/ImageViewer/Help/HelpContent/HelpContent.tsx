import { HelpWindowToolTitle } from "../HelpDialog/HelpWindowToolTitle";
import {
  ColorAdjustmentIcon,
  ColorSelectionIcon,
  EllipticalSelectionIcon,
  HandIcon,
  LassoSelectionIcon,
  MagneticSelectionIcon,
  PenSelectionIcon,
  PolygonalSelectionIcon,
  QuickSelectionIcon,
  RectangularSelectionIcon,
  SelectionIcon,
  ZoomIcon,
} from "../../../../icons";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import React from "react";
import Divider from "@mui/material/Divider";

export const ManipulatingCanvasContent = () => {
  return (
    <>
      <br />
      <HelpWindowToolTitle toolName={"Hand tool"} letter={"H"}>
        {/*// @ts-ignore */}
        <HandIcon />
      </HelpWindowToolTitle>
      <Typography>
        Hold and drag to pan the image in the canvas. Click on "Reset position"
        to center the image back onto the canvas.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Zoom tool"} letter={"Z"}>
        {/*// @ts-ignore */}
        <ZoomIcon />
      </HelpWindowToolTitle>
      <Typography>
        Use the zoom slider or your mouse wheel to zoom in or out of the image.
        Alternatively, click on the image to zoom in or out (select the desired
        zooming mode first).
      </Typography>
      <br />
      <Typography>
        To zoom in a particular region of the image, use your mouse to select
        the rectangular region in which you would like to zoom in. Release the
        mouse to zoom in the selected region.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Intensity adjustment"} letter={"I"}>
        {/*// @ts-ignore */}
        <ColorAdjustmentIcon />
      </HelpWindowToolTitle>
      <Typography>
        Filter each color channel by setting new minimum and maximum for each
        color channel. Untoggle a channel box to disable the channel. Click on
        "Reset" to reset the intensities to their original values.
      </Typography>
      <br />
    </>
  );
};

export const OpeningImagesHelpContent = () => {
  return (
    <>
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Opening images"}</Box>
      </Typography>
      <Typography>
        In the left menu, select "Open new image" to select one or multiple
        image files to open.
      </Typography>
      <br />
      <Typography>
        Alternatively, drag and drop the desired image files directly onto the
        canvas.
      </Typography>
      <br />
      <Typography>
        Note that we currently only support 1-channel (grayscale) or 3-channel
        2D images. We do not support multi-dimensional images.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Deleting images"}</Box>
      </Typography>
      <Typography>
        Images can be deleted from the workspace at any time by selecting
        "Delete image" on the menu options next to the image thumbnail.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Example pre-annotated images"}</Box>
      </Typography>
      <Typography>
        Take a look at our pre-annotated images by clicking "Open example image"
        and selecting the image of choice!
      </Typography>
      <br />
    </>
  );
};

export const CreatingCategoriesContent = () => {
  return (
    <>
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{" Creating a new category"}</Box>
      </Typography>
      <Typography>
        Create a new category by clicking on the "Create category" button. Once
        a category is created, its name and color can be changed at any time by
        selecting its "Edit category" menu on theego right of the catry icon.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">
          {" Changing the category of an annotation"}
        </Box>
      </Typography>
      <Typography>
        To change the category of an annotation, first select the annotation(s)
        to be changed and click on the desired new category button in the left
        toolbar. If the desired category does not exist, click "Create category"
        to make a new category.
      </Typography>
      <br />
      <Typography>
        Make sure to press the "Enter" key to save the selected annotations with
        the new category assigned.
      </Typography>
    </>
  );
};

export const MakingNewAnnotationsHelpContent = () => {
  return (
    <>
      <br />
      <Typography>
        All annotation tools are accessed from the toolbar to the right of the
        canvas or by using their keyboard key shortcut.
      </Typography>
      <br />
      <Typography>
        Once you an annotation is completed, press "Enter" on your keyboard or
        click on "confirm".
      </Typography>
      <br />
      <div>
        <Typography>
          To undo an unconfirmed annotation, press "Escape" on your keyboard or
          click on "cancel".
        </Typography>
      </div>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Rectangular annotation"} letter={"R"}>
        {/*// @ts-ignore */}
        <RectangularSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click and drag to start drawing a rectangular annotation (bounding box).
        Release to close the annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Elliptical annotation"} letter={"E"}>
        {/*// @ts-ignore */}
        <EllipticalSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click and drag to start drawing an elliptical annotation. Release to
        close the annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Pen annotation"} letter={"D"}>
        {/*// @ts-ignore */}
        <PenSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Select desired brush size using the brush size slider. Draw over pixels
        by clicking and dragging over the desired area. Release to close the
        annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Lasso annotation"} letter={"L"}>
        {/*// @ts-ignore */}
        <LassoSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click and drag cursor around the desired region. Release to
        automatically close the lasso annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Polygonal annotation"} letter={"P"}>
        {/*// @ts-ignore */}
        <PolygonalSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click and release to create new anchor points. Close the polygonal
        annotation either by clicking on its origin point or by hitting enter on
        your keyboard.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Magnetic annotation"} letter={"M"}>
        {/*// @ts-ignore */}
        <MagneticSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click and release to create new anchor points. The tool will
        automatically snap onto the edges of an object. Close the magnetic
        annotation by clicking on its origin point.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Color annotation"} letter={"C"}>
        {/*// @ts-ignore */}
        <ColorSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click on a pixel with the color of interest, hold and drag outwards to
        select a region of similar color intensities near the point. Release to
        finish the annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <HelpWindowToolTitle toolName={"Quick annotation"} letter={"Q"}>
        {/*// @ts-ignore */}
        <QuickSelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Click and drag to select a region of superpixels. Release to finish the
        annotation.
      </Typography>
      <br />
    </>
  );
};

export const ChangingAnnotationsHelpContent = () => {
  return (
    <>
      <br />
      <HelpWindowToolTitle toolName={"Select tool"} letter={"S"}>
        {/*// @ts-ignore */}
        <SelectionIcon />
      </HelpWindowToolTitle>
      <Typography>
        Use the Select tool to select annotations. Click on a desired annotation
        to select it, and hold shift while clicking other annotations to select
        multiple annotations. Alternatively, draw a rectangular box around
        multiple annotations to select multiple annotations at once.
      </Typography>
      <br />
      <Typography>
        Click on "Select all" in the Selection tool menu to select all existing
        annotations. To select/unselect annotations of a specific category,
        toggle/untoggle the corresponding category in the Selection tool menu.
      </Typography>
      <br />
      <Typography>
        In the case of overlapping annotations, repeatedly click on the
        intersecting region of the overlapping annotations until the desired
        annotation is selected.
      </Typography>
      <br />
      <Typography>
        Press the "Escape" key to undo changes or to unselect annotations.
      </Typography>
      <br />

      <Typography>
        Press the "Enter" key to confirm changes to a selected annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Resizing an annotation"}</Box>
      </Typography>
      <Typography>
        Once an annotation is selected, use the anchor points of the bouding box
        to resize it.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Adding area to an annotation"}</Box>
      </Typography>
      <Typography>
        Select the annotation tool to use to add an area and select the "add
        area" selection mode. Draw on the selected annotation with the
        annotation tool to combine areas together.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">
          {"Subtracting an area from an annotation"}
        </Box>
      </Typography>
      <Typography>
        Select the annotation tool to use to subtract an area and select the
        "subtract area" selection mode. Draw on the selected annotation with the
        annotation tool to subtract an area from the selected annotation.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">
          {"Intersection of two annotations"}
        </Box>
      </Typography>
      <Typography>
        Select the annotation tool to use to use for the intersection operation
        and select the "intersect" selection mode. Draw on the selected
        annotation with the annotation tool and release to obtain the
        intersection of the two annotations.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Deleting selected annotations"}</Box>
      </Typography>
      <Typography>
        First, use the Select tool to select annotations. To delete one or more
        selected annotations, press the Delete key or click on "Clear selected
        annotations" in the left toolbar.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">
          {"  Deleting all annotations for a single image"}
        </Box>
      </Typography>
      <Typography>
        To clear annotations of a particular image, click on the menu to the
        right of the image thumbnail and select "Clear annotations."
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Deleting all annotations"}</Box>
      </Typography>
      <Typography>
        Delete all annotations by clicking "Clear all annotations" in the left
        toolbar. WARNING: This will delete all annotations across all images
        loaded, not just the active image.
      </Typography>
      <br />
    </>
  );
};

export const SavingProjectHelpContent = () => {
  return (
    <>
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Saving a project"}</Box>
      </Typography>
      <Typography>
        Save all images and their annotations by clicking on "Save project file"
        in the Save menu on the left toolbar. This will download a .json file
        that encodes the image data and their annotations.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Opening a saved project"}</Box>
      </Typography>
      <Typography>
        To open a saved project and make new annotations or change annotations,
        Click "Open project file" in the Open menu on the left toolbar. Select
        the .json file that was downloaded when saving an earlier project.
      </Typography>
      <br />
      <Divider />
      <br />
      <Typography>
        <Box fontWeight="fontWeightBold">{"Exporting annotations"}</Box>
      </Typography>
      <Typography>
        To export all annotations simultaneously across all images, use the Save
        menu on the left toolbar. Otherwise, to export annotations of a single
        image, click on the corresponding image's submenu to export its
        annotations.
      </Typography>
      <br />
      <Typography>
        Annotations can be exported as color-labeled instance segmentation masks
        (a single image contains all instances labeled by different colors),
        binary instance segmentation masks (a single image contains a single
        instance), color-labeled semantic segmentation masks (a single image
        contains all categories labeled by different colors), binary semantic
        segmentation masks (a single image contains a single category with its
        corresponding instances), or label matrices (a single image contains all
        instances labeled by an integer).
      </Typography>
    </>
  );
};
