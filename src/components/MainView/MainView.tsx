import React, { useCallback } from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";
import { Box, CssBaseline } from "@mui/material";
import { createImage } from "../../store/slices";
import { useDispatch, useSelector } from "react-redux";
import { convertFileToImage } from "../../image/imageHelper";
import { currentColorsSelector } from "../../store/selectors/currentColorsSelector";

export const MainView = () => {
  const dispatch = useDispatch();

  const colors = useSelector(currentColorsSelector);

  const onUnload = (e: any) => {
    if (process.env.NODE_ENV === "development") {
      return;
    } else {
      e.preventDefault();
      return (e.returnValue = "Are you sure you want to exit?");
    }
  };

  React.useEffect(() => {
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const onDrop = useCallback(
    async (item) => {
      if (item) {
        for (let i = 0; i < item.files.length; i++) {
          const image = await convertFileToImage(item.files[i], colors, 1, 3); //todo fix: use dialog box
          dispatch(createImage({ image: image }));
        }
      }
    },
    [dispatch, colors]
  );

  return (
    <Box sx={{ height: "100vh" }}>
      <CssBaseline />

      <ApplicationAppBar />

      <ApplicationDrawer />

      <ImageGrid onDrop={onDrop} />
    </Box>
  );
};
