import { Box, Link, Typography } from "@mui/material";

import { CategoryTree } from "./CategoryTree";
import { useAnnotationSelection } from "./useAnnotationSelection";

/**
 * The mobile Categories tool's content. Reuses the same
 * useAnnotationSelection/CategoryTree the desktop drawer renders, rather than
 * a second, mobile-specific category UI.
 */
export const MobileCategoriesPanel = () => {
  const { groups, view, selectAll } = useAnnotationSelection();

  const header = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        pt: 1.25,
        pb: 0.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".5px",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Categories · {view.length} in view
      </Typography>
      <Link
        component="button"
        underline="none"
        onClick={selectAll}
        sx={{ fontSize: 12, fontWeight: 500 }}
      >
        Select all
      </Link>
    </Box>
  );

  return (
    <CategoryTree
      groups={groups.list}
      hiddenCount={groups.hidden}
      header={header}
    />
  );
};
