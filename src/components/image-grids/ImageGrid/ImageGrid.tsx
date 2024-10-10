import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, Grid } from "@mui/material";

import { projectSlice } from "store/project";

import { selectThingsOfKind } from "store/data";
import { ProjectGridItem } from "../ProjectGridItem";
import { useSortFunction } from "hooks";
import { DropBox } from "components/styled-components/DropBox/DropBox";
import { selectThingFilters } from "store/project/selectors";
import { isFiltered } from "utils/common/helpers";
import { selectActiveSelectedThingIds } from "store/project/reselectors";

const MAX_IMAGES = 1000; //number of images from the project that we'll show

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
              .map((thing) =>
                isFiltered(thing, thingFilters ?? {})
                  ? { filtered: true, thing }
                  : { filtered: false, thing }
              )
              // doing isFiltered(...) in sort would duplicate work,
              // so we do it above just once
              .sort((thingContainerA, thingContainerB) => {
                // all filtered go to bottom, regardless of "actual" sort order
                if (thingContainerA.filtered && thingContainerB.filtered) {
                  return 0;
                } else if (thingContainerA.filtered) {
                  return 1;
                } else if (thingContainerB.filtered) {
                  return -1;
                }
                // then determine "actual" sort order of non-filtered things
                return sortFunction(
                  thingContainerA.thing,
                  thingContainerB.thing
                );
              })
              .map((thingContainer, idx) => (
                <ProjectGridItem
                  key={thingContainer.thing.id}
                  thing={thingContainer.thing}
                  handleClick={handleSelectThing}
                  selected={selectedThingIds.includes(thingContainer.thing.id)}
                  // if we have more unfiltered things than MAX_IMAGES,
                  // we filter them out too
                  filtered={idx >= MAX_IMAGES || thingContainer.filtered}
                />
              ))}
          </Grid>
        </Container>
      </>
    </DropBox>
  );
};
