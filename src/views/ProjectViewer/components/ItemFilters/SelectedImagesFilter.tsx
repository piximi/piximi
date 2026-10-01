import { useDispatch, useSelector } from "react-redux";

import { Box, Checkbox, Typography } from "@mui/material";

import { projectSlice } from "@ProjectViewer/state";
import { selectFilterSelectedImages } from "@ProjectViewer/state/selectors";

/*
 * Unlike the other annotation filters, this one is not per-kind — it applies to
 * every kind tab at once.
 */
export const SelectedImagesFilter = () => {
  const dispatch = useDispatch();
  const onlySelectedImages = useSelector(selectFilterSelectedImages);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        mt: 2,
      }}
    >
      <Typography variant="body2">Only show from selected images</Typography>
      <Checkbox
        checked={onlySelectedImages}
        size="small"
        onChange={() =>
          dispatch(projectSlice.actions.toggleFilterSelectedImages())
        }
        sx={{ p: 0 }}
      />
    </Box>
  );
};
