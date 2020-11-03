import { put, takeEvery } from "redux-saga/effects";
import { open } from "@piximi/models";

import { openModelAction, openedModelAction } from "../../actions";
import { openSaga, watchOpenActionSaga } from "./openSaga";

describe("open", () => {
  it("dispatches 'openAction'", () => {
    const saga = watchOpenActionSaga();

    expect(saga.next().value).toEqual(takeEvery("CLASSIFIER_OPEN", openSaga));

    expect(saga.next().done).toBeTruthy();
  });

  it("executes the `open` function", async () => {
    const pathname =
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

    const opened = await open(pathname, 10, 100);

    const generator = openSaga(
      openModelAction({ pathname: pathname, classes: 10, units: 100 })
    );

    const _ = await generator.next();

    expect(generator.next(opened).value).toEqual(
      put(openedModelAction({ opened: opened }))
    );

    expect(generator.next().done).toBeTruthy();
  });
});
