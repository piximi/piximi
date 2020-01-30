import * as React from "react";
import {storiesOf} from "@storybook/react";
import {OpenExampleProjectMenuItem} from "./OpenExampleProjectMenuItem";
import {Provider} from "react-redux";
import {store} from "@piximi/store";

const closeMenu = () => {};

storiesOf("OpenExampleClassifierMenuItem", module).add("example", () => (
  <Provider store={store}>
    <OpenExampleProjectMenuItem closeMenu={closeMenu} />
  </Provider>
));
