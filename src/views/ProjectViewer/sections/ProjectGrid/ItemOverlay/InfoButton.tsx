import { IconButton, useTheme } from "@mui/material";
import { Info as InfoOutlinedIcon } from "@mui/icons-material";

import { HelpItem } from "help/HelpContent";

import { haloFilter } from "utils/styleUtils";

import { useInformationPopover } from "../information-popover";

import type { AnnotationRecord, ImageRecord } from "core/backend";

import type { PopoverState } from "../information-popover/InformationPopoverProvider";

export const InfoButton = ({
  itemId,
  itemType,
  item,
}: {
  itemId: string;
  itemType: "annotation" | "image";
  item?: ImageRecord | AnnotationRecord;
}) => {
  const theme = useTheme();
  const infoHalo = haloFilter(
    theme.palette.getContrastText(theme.palette.grey["300"]),
  );
  const { open } = useInformationPopover();

  const handleOpenDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    open({ itemId, itemType, anchorEl: e.currentTarget, item } as PopoverState);
  };

  return (
    <IconButton
      onClick={handleOpenDetails}
      sx={{ p: 0 }}
      data-help={HelpItem.GridItemInfo}
    >
      <InfoOutlinedIcon
        sx={{
          ml: "8px",
          filter: infoHalo,
          color: theme.palette.grey["300"],
        }}
      />
    </IconButton>
  );
};
