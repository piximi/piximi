import { useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, MenuItem, Tooltip } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { FunctionalDivider } from "@ProjectViewer/components";
import { projectSlice } from "@ProjectViewer/state";
import {
  selectActiveClassifierModelTarget,
  selectActiveViewState,
} from "@ProjectViewer/state/selectors";
import { AnnotationSortType, ImageSortType } from "@ProjectViewer/state/types";
import { useParameterizedSelector } from "store/hooks";
import { selectActiveSoftmaxById } from "store/classifier/selectors";

export const SortSelect = () => {
  const dispatch = useDispatch();
  const activeViewState = useSelector(selectActiveViewState);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const softmaxByItemId = useParameterizedSelector(
    selectActiveSoftmaxById,
    modelTarget,
  );

  const onSortKeyChange = (event: SelectChangeEvent<unknown>) => {
    if (activeViewState.view === "images")
      dispatch(
        projectSlice.actions.setImageSortType(
          event.target.value as ImageSortType,
        ),
      );
    else
      dispatch(
        projectSlice.actions.setAnnotationSortType({
          kindId: activeViewState.id,
          sortType: event.target.value as AnnotationSortType,
        }),
      );
  };
  const sortTypes =
    activeViewState.view === "images" ? ImageSortType : AnnotationSortType;
  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FunctionalDivider
        headerText="Sort Type"
        typographyVariant="body2"
        actions={
          <Box sx={{ px: 1 }}>
            <StyledSelect
              value={activeViewState.sortType}
              onChange={onSortKeyChange}
              variant="standard"
              disableUnderline
            >
              {Object.values(sortTypes).map((sortType) =>
                sortType === sortTypes.Softmax && !softmaxByItemId ? (
                  <Tooltip
                    key={sortType}
                    title="Only available during active prediction"
                  >
                    <span>
                      <MenuItem
                        key={sortType}
                        value={sortType}
                        dense
                        sx={{
                          borderRadius: 0,
                          minHeight: "1rem",
                        }}
                        disabled={
                          sortType === sortTypes.Softmax && !softmaxByItemId
                        }
                      >
                        {sortType}
                      </MenuItem>
                    </span>
                  </Tooltip>
                ) : (
                  <MenuItem
                    key={sortType}
                    value={sortType}
                    dense
                    sx={{
                      borderRadius: 0,
                      minHeight: "1rem",
                    }}
                    disabled={
                      sortType === sortTypes.Softmax && !softmaxByItemId
                    }
                  >
                    {sortType}
                  </MenuItem>
                ),
              )}
            </StyledSelect>
          </Box>
        }
        containerStyle={{ marginBottom: 0 }}
      />
    </Box>
  );
};
