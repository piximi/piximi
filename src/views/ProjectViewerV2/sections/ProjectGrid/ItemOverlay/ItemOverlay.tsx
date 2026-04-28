import { Box } from "@mui/material";

import { ItemCategoryIcon } from "./ItemCategoryIcon";
import { InfoButton } from "./InfoButton";

export const ItemOverlay = ({
  position,
  categoryColor,
  categoryName,
  usePredictedStyle,
  itemId,
  itemType,
}: {
  position: { top: string; left: string };
  categoryColor: string;
  categoryName: string;
  usePredictedStyle: boolean;
  itemId: string;
  itemType: "annotation" | "image";
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
      <InfoButton itemId={itemId} itemType={itemType} />
    </Box>
  );
};
