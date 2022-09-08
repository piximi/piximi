import { createAsyncThunk } from "@reduxjs/toolkit";

const echo = async (message: string): Promise<string> => {
  return message;
};

export const echoThunk = createAsyncThunk(
  "thunks/echo",
  async (message: string) => {
    return await echo(message);
  }
);
