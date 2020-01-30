import * as React from "react";
import {storiesOf} from "@storybook/react";
import {Provider} from "react-redux";
import {store} from "@piximi/store";
import {OpenProjectMenuItem} from "./OpenProjectMenuItem";

const closeMenu = () => {};

storiesOf("OpenProjectMenuItem", module).add("example", () => (
  <Provider store={store}>
    <OpenProjectMenuItem />
  </Provider>
));
