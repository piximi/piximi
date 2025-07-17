import React, { useMemo } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useTheme, Box, List, Stack } from "@mui/material";

import { useTranslation } from "hooks";
import { useAnnotatorToolShortcuts } from "../../../hooks";

import { Tool } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectToolType } from "views/ImageViewer/state/annotator/selectors";
import {
  Deselect as DeselectIcon,
  LabelOutlined as LabelOutlinedIcon,
  Label as LabelIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { Selection } from "icons";

import { ToolType } from "views/ImageViewer/utils/enums";
import {
  selectUpdatedActiveAnnotations,
  selectCategoriesArray,
} from "views/ImageViewer/state/annotator/reselectors";
import { PopoverTool } from "components/ui/Tool";
import { groupBy } from "lodash";
import { CustomListItemButton, DividerHeader } from "components/ui";
import { Category } from "store/data/types";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const SelectionOptions = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const activeTool = useSelector(selectToolType);
  const activeAnnotations = useSelector(selectUpdatedActiveAnnotations);
  const annotationCategories = useSelector(selectCategoriesArray);
  const t = useTranslation();

  useAnnotatorToolShortcuts();

  const groupedCategories = useMemo(() => {
    const objectCategories = annotationCategories.filter(
      (cat) => cat.kind !== "Image",
    );
    return Object.entries(groupBy(objectCategories, "kind"));
  }, [annotationCategories]);

  const handleSelectCategory = (categoryId: string) => {
    const annotationIds = activeAnnotations.reduce(
      (ids: string[], annotation) => {
        if (annotation.categoryId === categoryId) {
          ids.push(annotation.id);
        }
        return ids;
      },
      [],
    );
    batch(() => {
      dispatch(
        annotatorSlice.actions.setSelectedAnnotationIds({
          annotationIds: annotationIds,
          workingAnnotationId: annotationIds[0],
        }),
      );
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: annotationIds[0],
        }),
      );
    });
  };

  const handleSetSelectionTool = () => {
    if (activeTool !== ToolType.Pointer)
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.Pointer,
        }),
      );
  };

  const handleSelectAll = () => {
    dispatch(
      annotatorSlice.actions.setSelectedAnnotationIds({
        annotationIds: activeAnnotations.map((annotation) => annotation.id),
        workingAnnotationId: activeAnnotations[0].id,
      }),
    );
    dispatch(
      annotatorSlice.actions.setWorkingAnnotation({
        annotation: activeAnnotations[0],
      }),
    );
  };
  const handleDeselectAll = () => {
    dispatch(
      annotatorSlice.actions.setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      }),
    );
    dispatch(
      annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
    );
  };

  return (
    <Stack direction="row" data-help={HelpItem.SelectionTools}>
      <PopoverTool
        name={t("Select By...")}
        popoverElement={
          <Box sx={{ bgcolor: "background.paper", p: 1, minWidth: "200px" }}>
            {groupedCategories.map(([kind, categories]) => {
              return (
                <React.Fragment key={kind}>
                  <DividerHeader
                    key={kind}
                    typographyVariant="body2"
                    textAlign="left"
                  >
                    {kind}
                  </DividerHeader>
                  <List>
                    {categories.map((category: Category, idx: number) => {
                      return (
                        <CustomListItemButton
                          key={`${kind}-${idx}`}
                          primaryText={category.name}
                          onClick={() => handleSelectCategory(category.id)}
                          icon={
                            <LabelIcon
                              sx={{ color: category.color }}
                              fontSize="small"
                            />
                          }
                          sx={{
                            pl: 1,
                            "& .MuiListItemIcon-root": {
                              minWidth: 25,
                            },
                          }}
                          dense
                          disableGutters
                        />
                      );
                    })}
                  </List>
                </React.Fragment>
              );
            })}
          </Box>
        }
      >
        <LabelOutlinedIcon />
      </PopoverTool>

      <Tool name={t("Select All")} onClick={handleSelectAll}>
        <SelectAllIcon />
      </Tool>
      <Tool name={t("Deselect All")} onClick={handleDeselectAll}>
        <DeselectIcon />
      </Tool>
      <Tool name={t("Selection Tool")} onClick={handleSetSelectionTool}>
        <Selection
          color={
            activeTool === ToolType.Pointer
              ? theme.palette.primary.dark
              : theme.palette.text.primary
          }
        />
      </Tool>
    </Stack>
  );
};
