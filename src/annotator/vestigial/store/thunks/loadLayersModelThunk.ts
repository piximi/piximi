import { createAsyncThunk } from "@reduxjs/toolkit";
import * as tensorflow from "@tensorflow/tfjs";

export const loadLayersModelThunk = createAsyncThunk(
  "thunks/loadLayersModel",
  async ({ name, path }: { name: string; path: string }) => {
    return await tensorflow.loadLayersModel(path);
  }
);
