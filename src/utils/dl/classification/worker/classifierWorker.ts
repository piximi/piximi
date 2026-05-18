import * as Comlink from "comlink";
import { setBackend, ready, getBackend } from "@tensorflow/tfjs";

import { ClassifierHandler } from "./ClassifierHandler";

async function bootBackend() {
  try {
    await setBackend("webgl");
    await ready();
  } catch {
    await setBackend("cpu");
    await ready();
  }

  console.info("[classifierWorker] tf backend:", getBackend());
}

bootBackend();

Comlink.expose(new ClassifierHandler());
