import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import {createCategory, createImages, store} from "@piximi/store";
import {storiesOf} from "@storybook/react";
import * as React from "react";
import {Provider, useDispatch} from "react-redux";

import {GenerateButton} from "./GenerateButton";
import {Category, Image, Partition} from "@piximi/types";

const categories: Array<Category> = [
  {
    description: "a",
    identifier: "11111111-1111-1111-1111-11111111111",
    index: 1,
    visualization: {
      color: "#FFFFFF",
      visible: true
    }
  },
  {
    description: "b",
    identifier: "22222222-2222-2222-2222-22222222222",
    index: 2,
    visualization: {
      color: "#FFFFFF",
      visible: true
    }
  }
];

const images: Array<Image> = [
  {
    categoryIdentifier: "11111111-1111-1111-1111-11111111111",
    checksum: "",
    data: "https://picsum.photos/seed/piximi/224",
    identifier: "11111111-1111-1111-1111-11111111111",
    partition: Partition.Training,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: []
    }
  },
  {
    categoryIdentifier: "22222222-2222-2222-2222-22222222222",
    checksum: "",
    data: "https://picsum.photos/seed/piximi/224",
    identifier: "22222222-2222-2222-2222-22222222222",
    partition: Partition.Validation,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: []
    }
  }
];

const theme = createMuiTheme({
  palette: {
    type: "light"
  }
});

storiesOf("GenerateButton", module).add("example", () => {
  const next = () => {};

  store.dispatch(createImages({images: images}));

  categories.forEach((category: Category) => {
    store.dispatch(createCategory({category: category}));
  });

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GenerateButton next={next} />
      </ThemeProvider>
    </Provider>
  );
});
