import * as React from "react";
import {storiesOf} from "@storybook/react";
import {SaveClassifierDialog} from "./SaveClassifierDialog";
import {Project} from "@piximi/types";

const classifier: Project = {
  categories: [],
  images: [],
  name: "example"
};

const onClose = () => {};

storiesOf("SaveClassifierDialog", module).add("example", () => (
  <SaveClassifierDialog classifier={classifier} onClose={onClose} open />
));
