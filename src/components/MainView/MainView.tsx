import React, { useCallback } from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";
import { Box, CssBaseline } from "@mui/material";
import { createImage } from "../../store/slices";
import { useDispatch } from "react-redux";
import { convertFileToImage } from "../../image/imageHelper";

export const MainView = () => {
  const dispatch = useDispatch();

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
          const image = await convertFileToImage(item.files[i]);
          dispatch(createImage({ image: image }));
        }
      }
    },
    [dispatch]
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
