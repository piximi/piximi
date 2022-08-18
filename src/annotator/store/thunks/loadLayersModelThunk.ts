import { createAsyncThunk } from "@reduxjs/toolkit";
import { loadLayersModel } from "@tensorflow/tfjs";

export const loadLayersModelThunk = createAsyncThunk(
  "thunks/loadLayersModel",
  async ({ name, path }: { name: string; path: string }) => {
    return await loadLayersModel(path);
  }
);
