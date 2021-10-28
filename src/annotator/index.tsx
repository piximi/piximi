import React from "react";
import ReactDOM from "react-dom";
import reportWebVitals from "./reportWebVitals";
import { ImageViewer } from "./components";
import { Provider } from "react-redux";
import { store } from "./store";
import * as Sentry from "@sentry/react";
import "./i18n";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

Sentry.init({
  dsn: "https://756e21ab7263457eab9bc2f65edddc79@o71028.ingest.sentry.io/5668724",
  release: "annotator@" + process.env.npm_package_version,
});

ReactDOM.render(
  <>
    {" "}
    {/* @ts-ignore */}
    <React.StrictMode>
      <Provider store={store}>
        {/* @ts-ignore */}
        <DndProvider backend={HTML5Backend}>
          <ImageViewer />
        </DndProvider>
      </Provider>
    </React.StrictMode>
  </>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
