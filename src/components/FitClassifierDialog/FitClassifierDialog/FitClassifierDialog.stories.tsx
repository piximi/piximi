import React from "react";
import { storiesOf } from "@storybook/react";
import { FitClassifierDialog } from "./FitClassifierDialog";
import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core";
import * as types from "@piximi/types";

const closeDialog = () => {};

const theme = createMuiTheme({
  palette: {
    type: "light",
  },
});

const categories: types.Category[] = [
  {
    description: "aaa",
    identifier: "00000000-0000-0000-0000-000000000000",
    index: 0,
    visualization: {
      color: "",
      visible: true,
    },
  },
  {
    description: "bbb",
    identifier: "11111111-0000-0000-0000-000000000000",
    index: 1,
    visualization: {
      color: "",
      visible: true,
    },
  },
  {
    description: "ccc",
    identifier: "22222222-0000-0000-0000-000000000000",
    index: 2,
    visualization: {
      color: "",
      visible: true,
    },
  },
];

const images: types.Image[] = [
  {
    categoryIdentifier: "11111111-0000-0000-0000-000000000000",
    checksum: "",
    data: "https://picsum.photos/224/224",
    identifier: "00000000-1111-0000-0000-000000000000",
    partition: types.Partition.Training,
    scores: [],
    visualization: {
      brightness: 1.0,
      contrast: 1.0,
      visible: true,
      visibleChannels: [],
    },
  },
  {
    categoryIdentifier: "11111111-0000-0000-0000-000000000000",
    checksum: "",
    data: "https://picsum.photos/224/224",
    identifier: "00000000-2222-0000-0000-000000000000",
    partition: types.Partition.Training,
    scores: [],
    visualization: {
      brightness: 1.0,
      contrast: 1.0,
      visible: true,
      visibleChannels: [],
    },
  },
  {
    categoryIdentifier: "22222222-0000-0000-0000-000000000000",
    checksum: "",
    data: "https://picsum.photos/224/224",
    identifier: "00000000-3333-0000-0000-000000000000",
    partition: types.Partition.Training,
    scores: [],
    visualization: {
      brightness: 1.0,
      contrast: 1.0,
      visible: true,
      visibleChannels: [],
    },
  },
  {
    categoryIdentifier: "22222222-0000-0000-0000-000000000000",
    checksum: "",
    data: "https://picsum.photos/224/224",
    identifier: "00000000-4444-0000-0000-000000000000",
    partition: types.Partition.Training,
    scores: [],
    visualization: {
      brightness: 1.0,
      contrast: 1.0,
      visible: true,
      visibleChannels: [],
    },
  },
];

storiesOf("FitClassifierDialog", module).add("large MNIST", () => (
  <ThemeProvider theme={theme}>
    <FitClassifierDialog
      categories={categories}
      closeDialog={closeDialog}
      images={images}
      openedDialog
      openedDrawer={false}
      setImagesPartition={() => {}}
      datasetInitialized={true}
      setDatasetInitialized={(partitions) => {}}
    />
  </ThemeProvider>
));
