import { useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { Box, MenuItem, Popover, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { generateCategory } from "core/entities";
import { useBackend } from "core/backend";

import { IncrementalSlider, StyledSelect, WithLabel } from "components/inputs";
import { CategoryDialog } from "components/dialogs";

import {
  selectImageCategories,
  selectPlanesByImageId,
} from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";

import { DIMENSIONS } from "utils/constants";

import { useActiveImage } from "@ImageViewer/contexts/ActiveImageProvider";

import type { SelectChangeEvent } from "@mui/material";

import type { Category, ExtendedImageObject } from "core/entities";

const NEW_CATEGORY = "new-category";
const CATEGORY_DIALOG_OPTIONS = { type: "image" } as const;

const PIXEL_COLOR_WIDTH = "25ch";
export const ActiveImageInfoStrip = ({
  image,
  absolutePosition,
  width,
  show,
}: {
  image: ExtendedImageObject;
  absolutePosition?: { x: number; y: number };
  width: number;
  show: boolean;
}) => {
  const backend = useBackend();
  const imageCategories: Category[] = useSelector(selectImageCategories);
  const planes = useParameterizedSelector(selectPlanesByImageId, image.id);
  // The image's category and active plane are the backend's to write and
  // take effect at once; the store follows its announcements.
  const report = (what: string) => (error: unknown) =>
    console.error(`[ActiveImageInfoStrip] ${what}`, error);
  const [planeSliderEl, setPlaneSliderEl] = useState<HTMLDivElement | null>(
    null,
  );
  const numPlanes = image.shape.planes;
  const imageIsZStack = numPlanes > 1;

  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] =
    useState(false);

  const { channelData, composite, channelsLoading } = useActiveImage();

  const xPos = useMemo(
    () => (absolutePosition && show ? absolutePosition.x : "n/a"),
    [absolutePosition, show],
  );

  const yPos = useMemo(
    () => (absolutePosition && show ? absolutePosition.y : "n/a"),
    [absolutePosition, show],
  );

  const displayedPixelColor = useMemo(() => {
    if (!absolutePosition || !show || channelsLoading) return "n/a";
    const index = absolutePosition.y * image.shape.width + absolutePosition.x;
    // Without raw channels, the composite's colour is what there is to show.
    if (channelData.length === 0 && composite) {
      return Array.from(composite.data.subarray(index * 4, index * 4 + 3)).join(
        ", ",
      );
    }
    return channelData.map((ch) => ch.data[index]).join(", ");
  }, [absolutePosition, show, image, channelsLoading, channelData, composite]);
  const handleSelectCategory = (event: SelectChangeEvent<unknown>) => {
    const catId = event.target.value as string;
    if (catId === NEW_CATEGORY) {
      setCreateCategoryDialogOpen(true);
      return;
    }
    backend.images
      .categorize({ ids: [image.id] }, catId)
      .catch(report("categorize"));
  };
  const handleCreateCategory = (name: string, color: string) => {
    const newCategory = generateCategory(name, color, { type: "image" });
    backend.categories
      .create([newCategory])
      .then(() =>
        backend.images.categorize({ ids: [image.id] }, newCategory.id),
      )
      .catch(report("create category"));
  };
  const zStackCallback = async (newValue: number | number[]) => {
    if (typeof newValue !== "number") return;
    const plane = planes.find((p) => p.zIndex === newValue);
    if (!plane || plane.id === image.activePlaneId) return;
    backend.images
      .update([{ id: image.id, activePlaneId: plane.id }])
      .catch(report("change plane"));
  };

  return (
    <Box
      data-doc="image-info-strip"
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
          labelProps={{ variant: "body2", sx: { pr: 1 } }}
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
        <Box
          onClick={(e) => {
            imageIsZStack && setPlaneSliderEl(e.currentTarget);
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: imageIsZStack ? "pointer" : "default",
          }}
        >
          <Typography variant="body2">Plane: {image.activePlaneIdx}</Typography>
          {imageIsZStack && <ArrowDropDownIcon />}
        </Box>
        <Popover
          open={!!planeSliderEl}
          anchorEl={planeSliderEl}
          onClose={() => setPlaneSliderEl(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          slotProps={{ paper: { sx: { overflow: "visible" } } }}
        >
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "8px",
            }}
          >
            <IncrementalSlider
              min={0}
              max={image.shape.planes}
              step={1}
              initialValue={image.activePlaneIdx}
              callback={zStackCallback}
              orientation="vertical"
              length="100px"
              callbackOnSlide={true}
              outerStyle={{ borderRadius: 0 }}
            />
          </Box>
        </Popover>
      </Box>
      <CategoryDialog
        open={createCategoryDialogOpen}
        action="create"
        onConfirm={handleCreateCategory}
        onClose={() => setCreateCategoryDialogOpen(false)}
        options={CATEGORY_DIALOG_OPTIONS}
      />
    </Box>
  );
};
