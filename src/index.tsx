import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Application } from "./components/Application";

ReactDOM.render(<Application />, document.getElementById("root"));

serviceWorker.register();
