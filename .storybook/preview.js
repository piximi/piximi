import {Provider} from "react-redux";
import {productionStore} from "../src/store/stores";
import React from "react";

export const decorators = [
  (Story) => (
      <Provider store={productionStore}>
        <Story />
      </Provider>
  ),
];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
}