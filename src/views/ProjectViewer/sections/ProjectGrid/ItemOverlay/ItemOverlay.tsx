import { Box } from "@mui/material";

import { ItemCategoryIcon } from "./ItemCategoryIcon";
import { InfoButton } from "./InfoButton";

import type { AnnotationRecord, ImageRecord } from "core/backend";

export const ItemOverlay = ({
  position,
  categoryColor,
  categoryName,
  usePredictedStyle,
  itemId,
  itemType,
  item,
}: {
  position: { top: string; left: string };
  categoryColor: string;
  categoryName: string;
  usePredictedStyle: number | undefined;
  itemId: string;
  itemType: "annotation" | "image";
  item?: ImageRecord | AnnotationRecord;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        top: position.top,
        left: position.left,
      }}
    >
      <ItemCategoryIcon
        backgroundColor={categoryColor}
        categoryName={categoryName}
        predicted={usePredictedStyle}
      />
      <InfoButton itemId={itemId} itemType={itemType} item={item} />
    </Box>
  );
};
