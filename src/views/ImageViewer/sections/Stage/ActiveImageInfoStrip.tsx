import { useMemo, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, MenuItem, Typography } from "@mui/material";

import { CategoryDialog } from "components/dialogs";
import { StyledSelect, WithLabel } from "components/inputs";

import type { Category, ExtendedImageObject } from "store/dataV2/types";
import { dataSliceV2 } from "store/dataV2";
import { generateCategory } from "store/dataV2/utils";
import { selectImageCategories } from "store/dataV2/selectors";
import { useActiveImage } from "@ImageViewer/contexts/ActiveImageProvider";

import { DIMENSIONS } from "utils/constants";

const NEW_CATEGORY = "new-category";
const CATEGORY_DIALOG_OPTIONS = { type: "image" } as const;

const PIXEL_COLOR_WIDTH = "25ch";
export const ActiveImageInfoStrip = ({
  image,
  absolutePosition,
  width,
  show,
}: {
  image: ExtendedImageObject | null;
  absolutePosition?: { x: number; y: number };
  width: number;
  show: boolean;
}) => {
  const dispatch = useDispatch();
  const imageCategories: Category[] = useSelector(selectImageCategories);

  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] =
    useState(false);

  const { channelData, channelsLoading } = useActiveImage();

  const xPos = useMemo(
    () => (absolutePosition && show ? absolutePosition.x : "n/a"),
    [absolutePosition, show],
  );

  const yPos = useMemo(
    () => (absolutePosition && show ? absolutePosition.y : "n/a"),
    [absolutePosition, show],
  );

  const displayedPixelColor = useMemo(() => {
    if (!absolutePosition || !show || channelsLoading || !image) return "n/a";

    return channelData
      .map(
        (ch) =>
          ch.data[absolutePosition.y * image.shape.width + absolutePosition.x],
      )
      .join(", ");
  }, [absolutePosition, show, image, channelsLoading, channelData]);
  const handleSelectCategory = (event: SelectChangeEvent<unknown>) => {
    if (!image) return;
    const catId = event.target.value as string;
    if (catId === NEW_CATEGORY) {
      setCreateCategoryDialogOpen(true);
    }

    dispatch(
      dataSliceV2.actions.updateImageCategory({
        id: image.id,
        categoryId: catId,
      }),
    );
  };
  const handleCreateCategory = (name: string, color: string) => {
    const newCategory = generateCategory(name, color, { type: "image" });
    batch(() => {
      dispatch(dataSliceV2.actions.addCategory(newCategory));
    });
  };

  return image ? (
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
              width: image ? PIXEL_COLOR_WIDTH : undefined,
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
          Timepoint: {image.timepoint !== undefined ? image.timepoint : "N/A"}
        </Typography>
        <WithLabel
          label="Image Category:"
          labelProps={{ variant: "body2", pr: 1 }}
        >
          <StyledSelect
            value={image.categoryId}
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
        <Typography variant="body2">Plane: {image.activePlaneIdx}</Typography>
      </Box>
      <CategoryDialog
        open={createCategoryDialogOpen}
        action="create"
        onConfirm={handleCreateCategory}
        onClose={() => setCreateCategoryDialogOpen(false)}
        options={CATEGORY_DIALOG_OPTIONS}
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
