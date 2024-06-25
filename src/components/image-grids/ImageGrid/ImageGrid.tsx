import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, Grid } from "@mui/material";

import { projectSlice } from "store/project";

import { selectThingsOfKind } from "store/data";
import { ProjectGridItem } from "../ProjectGridItem";
import { useSortFunction } from "hooks/useSortFunction/useSortFunction";
import { DropBox } from "components/styled-components/DropBox/DropBox";
import { selectThingFilters } from "store/project/selectors";
import { isFiltered } from "utils/common/helpers";
import { selectActiveSelectedThingIds } from "store/project/reselectors";
import { AnnotationObject, ImageObject } from "store/data/types";

const max_images = 1000; //number of images from the project that we'll show

//NOTE: kind is passed as a prop and used internally instead of the kind returned
// by the active kind selector to keep from rerendering the grid items when switching tabs

export const ImageGrid = ({ kind }: { kind: string }) => {
  const dispatch = useDispatch();
  const things = useSelector(selectThingsOfKind)(kind);
  const thingFilters = useSelector(selectThingFilters)[kind];
  const selectedThingIds = useSelector(selectActiveSelectedThingIds);
  const sortFunction = useSortFunction();

  //const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();

  const handleSelectThing = useCallback(
    (id: string, selected: boolean) => {
      if (selected) {
        dispatch(projectSlice.actions.deselectThings({ ids: id }));
      } else {
        dispatch(projectSlice.actions.selectThings({ ids: id }));
      }
    },
    [dispatch]
  );

  //   useHotkeys("esc", () => handleDeselectAll(), HotkeyView.ProjectView, {
  //     enabled: tabIndex === 0,
  //   });
  //   useHotkeys(
  //     "backspace, delete",
  //     () => onOpenDeleteImagesDialog(),
  //     HotkeyView.ProjectView,
  //     { enabled: tabIndex === 0 }
  //   );
  //   useHotkeys(
  //     "control+a",
  //     () => handleSelectAll(),
  //     HotkeyView.ProjectView,
  //     { enabled: tabIndex === 0 },
  //     [images]
  //   );

  return (
    <DropBox>
      <>
        <Container
          sx={(theme) => ({
            paddingBottom: theme.spacing(8),
            height: "100%",
            overflowY: "scroll",
          })}
          maxWidth={false}
        >
          <Grid
            container
            gap={2}
            sx={{
              transform: "translateZ(0)",
              height: "100%",
              overflowY: "scroll",
            }}
          >
            {things
              .slice(0, max_images)
              .sort(sortFunction)
              .map((thing: ImageObject | AnnotationObject) => (
                <ProjectGridItem
                  key={thing.id}
                  thing={thing}
                  handleClick={handleSelectThing}
                  selected={selectedThingIds.includes(thing.id)}
                  filtered={isFiltered(thing, thingFilters ?? {})}
                />
              ))}
          </Grid>
        </Container>
      </>
    </DropBox>
  );
};
