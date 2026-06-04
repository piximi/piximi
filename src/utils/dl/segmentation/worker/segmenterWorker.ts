import * as Comlink from "comlink";
import { setBackend, ready, getBackend } from "@tensorflow/tfjs";

import { SegmenterHandler } from "./SegmenterHandler";

async function bootBackend() {
  try {
    await setBackend("webgl");
    await ready();
  } catch {
    await setBackend("cpu");
    await ready();
  }

  console.info("[segmenterWorker] tf backend:", getBackend());
}

bootBackend();

Comlink.expose(new SegmenterHandler());
