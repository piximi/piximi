import { IconButton, useTheme } from "@mui/material";
import { Info as InfoOutlinedIcon } from "@mui/icons-material";

import { haloFilter } from "utils/styleUtils";

import { useInformationPopover } from "../information-popover";

export const InfoButton = ({
  itemId,
  itemType,
}: {
  itemId: string;
  itemType: "annotation" | "image";
}) => {
  const theme = useTheme();
  const infoHalo = haloFilter(
    theme.palette.getContrastText(theme.palette.grey["300"]),
  );
  const { open } = useInformationPopover();

  const handleOpenDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    open({ itemId, itemType, anchorEl: e.currentTarget });
  };

  return (
    <IconButton onClick={handleOpenDetails} sx={{ p: 0 }}>
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
