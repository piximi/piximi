import { useSelector } from "react-redux";

import { Badge, Box, Typography } from "@mui/material";
import { FilterAltOutlined as FilterIcon } from "@mui/icons-material";

import { useWindowSize } from "hooks";

import { PopperToolButton } from "components/inputs";

import { DIMENSIONS } from "utils/constants";

import { ItemFilters } from "@ProjectViewer/components";
import { selectActiveStateIsFiltered } from "@ProjectViewer/state/selectors";

export const SortFilter = () => {
  const filtersExist = useSelector(selectActiveStateIsFiltered);
  const { height: windowHeight } = useWindowSize();

  return (
    <>
      <PopperToolButton
        name="Sort | Filter"
        onClick={() => {}}
        icon={
          <Badge
            color="primary"
            variant="dot"
            invisible={!filtersExist}
            sx={{
              "& .MuiBadge-badge": {
                top: 4,
                right: "100%",
              },
            }}
          >
            <FilterIcon />
          </Badge>
        }
        popperContent={
          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: "1fr",
              gridTemplateRows: `${theme.spacing(4)} 1fr`,
              gap: theme.spacing(1),
              pb: theme.spacing(1),
              bgcolor: "var(--mui-palette-background-paper)",
              minWidth: DIMENSIONS.leftDrawerWidth,
              width: DIMENSIONS.leftDrawerWidth,
              border: "1px solid var(--mui-palette-text-primary)",
              borderRadius: 2,
            })}
          >
            <Box
              width={"100%"}
              sx={(theme) => ({
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderBottom: "1px solid " + theme.palette.text.primary,
              })}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "normal",
                  textTransform: "capitalize",
                  marginInline: "auto",
                  maxWidth: "fit-content",
                }}
              >
                {"Sort | Filter"}
              </Typography>
            </Box>
            <Box
              sx={(theme) => ({
                maxHeight: `calc(${(windowHeight - DIMENSIONS.toolDrawerWidth) * 0.9}px - ${theme.spacing(9)})`,
                overflowY: "scroll",
              })}
            >
              <ItemFilters />
            </Box>
          </Box>
        }
      />
    </>
  );
};
