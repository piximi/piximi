import * as Comlink from "comlink";
import { setBackend, ready, getBackend } from "@tensorflow/tfjs";

import { ClassifierHandler } from "./ClassifierHandler";

async function bootBackend(): Promise<string> {
  let backend: string;
  try {
    await setBackend("webgl");
    await ready();
    backend = "webgl";
  } catch {
    await setBackend("cpu");
    await ready();
    backend = "cpu";
  }

  console.info("[classifierWorker] tf backend:", getBackend());
  return backend;
}

const backend = await bootBackend();

Comlink.expose(new ClassifierHandler(backend));
