/*
 * Run-length encoding
 */

export const decode = (encoded: Array<number>): Uint8ClampedArray => {
  let decoded = [];

  let background = true;

  for (let i = 0; i < encoded.length; i++) {
    for (let j = 0; j < encoded[i]; j++) {
      decoded.push(background ? 0 : 255);
    }

    background = !background;
  }

  return new Uint8ClampedArray(decoded);
};

export const encode = (
  decoded: Uint8Array | Uint8ClampedArray
): Array<number> => {
  let lastElement = decoded[0];

  let lastSequenceSize = 1;

  let encoded = [];

  if (decoded[0] === 255) {
    encoded.push(0);
  }

  for (let i = 1; i < decoded.length; i++) {
    if (lastElement !== decoded[i]) {
      encoded.push(lastSequenceSize);

      lastElement = decoded[i];

      lastSequenceSize = 1;
    } else {
      lastSequenceSize += 1;
    }
  }

  encoded.push(lastSequenceSize);

  return encoded;
};

export const fromString = (s: Array<number>) => {
  let counts = [];
  let m = 0;
  let p = 0;
  let k;
  let x;
  let more;

  while (s[p]) {
    x = 0;
    k = 0;
    more = 1;

    while (more) {
      let c = s[p] - 48;
      x = x | ((c & 0x1f) << (5 * k));
      more = c & 0x20;
      p += 1;
      k += 1;

      if (!more && c & 0x10) {
        x = x | (-1 << (5 * k));
      }
    }

    if (m > 2) {
      x += counts[m - 2];
    }

    counts[m++] = x;
  }

  return counts;
};

export const toImageData = (
  decoded: Uint8ClampedArray,
  width: number,
  height: number
) => {
  let data = [];

  for (let i = 0; i < decoded.length; i++) {
    data.push(...[decoded[i], decoded[i], decoded[i], 255]);
  }

  const clamped = new Uint8ClampedArray(data);

  return new ImageData(clamped, width, height);
};
