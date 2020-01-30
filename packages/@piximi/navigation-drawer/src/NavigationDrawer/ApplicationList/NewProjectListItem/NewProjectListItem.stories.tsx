import * as React from "react";
import {storiesOf} from "@storybook/react";
import {NewProjectListItem} from "./NewProjectListItem";
import {Provider} from "react-redux";
import {store} from "@piximi/store";

storiesOf("NewProjectListItem", module).add("example", () => (
  <Provider store={store}>
    <NewProjectListItem />
  </Provider>
));
