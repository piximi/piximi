import { decode, encode } from "@msgpack/msgpack";

import { isMessage } from "./messages";

import type { Message } from "./messages";

/*
 * Messages are msgpack so that pixel buffers travel as native binary;
 * `Uint8Array` values encode as msgpack `bin` and decode back as `Uint8Array`.
 */

export const encodeMessage = (message: Message): Uint8Array => encode(message);

export const decodeMessage = (bytes: Uint8Array): Message => {
  const value = decode(bytes);
  if (!isMessage(value)) {
    throw new Error("Not an RPC message");
  }
  return value;
};
