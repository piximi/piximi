import { Box, MenuItem, SelectChangeEvent, Typography } from "@mui/material";
import { CategoryDialog } from "components/dialogs";
import { StyledSelect, WithLabel } from "components/inputs";
import { useMemo, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { IMAGE_KIND } from "store/data/constants";
import { selectImageCategories } from "store/data/selectors";
import { generateCategory, generateUUID } from "store/data/utils";
import { DIMENSIONS } from "utils/constants";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { selectActiveImage } from "views/ImageViewer/state/image-viewer-data/reselectors";

const NEW_CATEGORY = "new-category";
// Space needed to display the rgb values for the colors, prevents label from moving with cursor move
//TODO Will need to be adjusted to deal with moving to channel colors
const COLOR_WIDTH_8BIT = "19ch";
const COLOR_WIDTH_16BIT = "25ch";
export const ActiveImageInfoContainer = ({
  absolutePosition,
  pixelColor,
  width,
  show,
}: {
  absolutePosition?: { x: number; y: number };
  pixelColor?: string;
  width: number;
  show: boolean;
}) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const imageCategories = useSelector(selectImageCategories);

  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] =
    useState(false);

  const xPos = useMemo(
    () => (absolutePosition && show ? absolutePosition.x : "n/a"),
    [absolutePosition, show],
  );

  const yPos = useMemo(
    () => (absolutePosition && show ? absolutePosition.y : "n/a"),
    [absolutePosition, show],
  );

  const displayedPixelColor = useMemo(
    () => (absolutePosition && show ? pixelColor : "n/a"),
    [absolutePosition, show, pixelColor],
  );
  const handleSelectCategory = (event: SelectChangeEvent<unknown>) => {
    const catId = event.target.value as string;
    if (catId === NEW_CATEGORY) {
      setCreateCategoryDialogOpen(true);
    }

    dispatch(
      dataSlice.actions.updateImageData({
        id: activeImage!.id,
        changes: { categoryId: catId },
      }),
    );
  };
  const handleCreateCategory = (kind: string, name: string, color: string) => {
    const newId = generateUUID();

    batch(() => {
      dispatch(
        dataSlice.actions.addCategory(generateCategory(name, kind, color)),
      );
      dispatch(imageViewerDataSlice.actions.setActiveImageCategory(newId));
    });
  };

  return activeImage ? (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        width: width + "px",
        height: DIMENSIONS.stageInfoHeight,
        justifyContent: "space-between",
        alignItems: "center",
        display: "flex",
      })}
    >
      <Box sx={{ width: "50%" }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            px: "1.5rem",
          }}
        >
          <Typography variant="body2">{`x: ${xPos} , y: ${yPos} `}</Typography>
          <Box
            sx={{
              display: "flex",
              width: activeImage
                ? activeImage.bitDepth === 8
                  ? COLOR_WIDTH_8BIT
                  : COLOR_WIDTH_16BIT
                : undefined,
              justifyContent: "flex-start",
            }}
          >
            <Typography variant="body2">{`Pixel Color: ${displayedPixelColor}`}</Typography>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "50%",
          px: "1.5rem",
        }}
      >
        <Typography variant="body2">
          Timepoint:{" "}
          {activeImage.timepoint !== undefined ? activeImage.timepoint : "N/A"}
        </Typography>
        <WithLabel
          label="Image Category:"
          labelProps={{ variant: "body2", pr: 1 }}
        >
          <StyledSelect
            value={activeImage.categoryId}
            onChange={handleSelectCategory}
            variant="standard"
          >
            <MenuItem
              key={NEW_CATEGORY}
              value={NEW_CATEGORY}
              dense
              sx={{
                borderRadius: 0,
                minHeight: "1rem",
              }}
            >
              {"Create New"}
            </MenuItem>
            {imageCategories.map((cat) => (
              <MenuItem
                key={cat.id}
                value={cat.id}
                dense
                sx={{
                  borderRadius: 0,
                  minHeight: "1rem",
                }}
              >
                {cat.name}
              </MenuItem>
            ))}
          </StyledSelect>
        </WithLabel>
        <Typography variant="body2">
          Plane: {activeImage.activePlane}
        </Typography>
      </Box>
      <CategoryDialog
        open={createCategoryDialogOpen}
        kind={IMAGE_KIND}
        action="create"
        onConfirm={handleCreateCategory}
        onClose={() => setCreateCategoryDialogOpen(false)}
      />
    </Box>
  ) : (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        width: width - 2 + "px",
        height: DIMENSIONS.stageInfoHeight,

        position: "absolute",
        bottom: 0,
        zIndex: 1000,
      })}
    ></Box>
  );
};
