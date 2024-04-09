// ignore-no-logs
import * as tf from "@tensorflow/tfjs-node";
import { matchedCropPad, padToMatch } from "../helpers";

it("padToMatch", async () => {
  const sample = tf.tensor3d([
    [
      [1, 10, 100],
      [2, 20, 200],
      [3, 30, 300],
      [4, 40, 400],
    ],
    [
      [5, 50, 500],
      [6, 60, 600],
      [7, 70, 700],
      [8, 80, 800],
    ],
  ]);

  const profile = await tf.profile(() =>
    padToMatch(sample, { width: 5, height: 5 }, "constant")
  );
  const result = profile.result as tf.Tensor3D;
  const padded = result.arraySync();

  // console.log(`newBytes: ${profile.newBytes}`);
  // console.log(`newTensors: ${profile.newTensors}`);

  const expected = [
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [1, 10, 100],
      [2, 20, 200],
      [3, 30, 300],
      [4, 40, 400],
      [0, 0, 0],
    ],
    [
      [5, 50, 500],
      [6, 60, 600],
      [7, 70, 700],
      [8, 80, 800],
      [0, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
  ];

  const paddedAgain = padToMatch(
    result,
    { width: 5, height: 5 },
    "constant"
  ).arraySync();

  expect(padded).toStrictEqual(expected);
  expect(paddedAgain).toStrictEqual(expected);
});

const matchedRandomCropExpectations = (
  cropCoords: [number, number, number, number],
  cropCoordsExpected: number[][]
) => {
  expect(cropCoords[0]).toBeGreaterThanOrEqual(cropCoordsExpected[0][0]);
  expect(cropCoords[0]).toBeLessThanOrEqual(cropCoordsExpected[0][1]);

  expect(cropCoords[1]).toBeGreaterThanOrEqual(cropCoordsExpected[1][0]);
  expect(cropCoords[1]).toBeLessThanOrEqual(cropCoordsExpected[1][1]);

  expect(cropCoords[2]).toBeGreaterThanOrEqual(cropCoordsExpected[2][0]);
  expect(cropCoords[2]).toBeLessThanOrEqual(cropCoordsExpected[2][1]);

  expect(cropCoords[3]).toBeGreaterThanOrEqual(cropCoordsExpected[3][0]);
  expect(cropCoords[3]).toBeLessThanOrEqual(cropCoordsExpected[3][1]);
};

const matchedCenterCropExpectations = (
  cropCoords: [number, number, number, number],
  cropCoordsExpected: number[]
) => {
  expect(cropCoords[0]).toBe(cropCoordsExpected[0]);
  expect(cropCoords[1]).toBe(cropCoordsExpected[1]);
  expect(cropCoords[2]).toBe(cropCoordsExpected[2]);
  expect(cropCoords[3]).toBe(cropCoordsExpected[3]);
};

const matchedCropExpectations = (
  dims: {
    sampleWidth: number;
    sampleHeight: number;
    cropWidth: number;
    cropHeight: number;
    randomCrop: boolean;
  },
  cropCoords: [number, number, number, number],
  cropCoordsExpected: number[][] | number[]
) => {
  if (dims.randomCrop) {
    matchedRandomCropExpectations(cropCoords, cropCoordsExpected as number[][]);
  } else {
    matchedCenterCropExpectations(cropCoords, cropCoordsExpected as number[]);
  }

  expect(cropCoords[2] - cropCoords[0]).toBeCloseTo(
    dims.cropHeight / dims.sampleHeight,
    5
  );
  expect(cropCoords[3] - cropCoords[1]).toBeCloseTo(
    dims.cropWidth / dims.sampleWidth,
    5
  );
};

describe("matchedCropPad - random", () => {
  it("crop small square from big square", () => {
    const dims = {
      sampleWidth: 100,
      sampleHeight: 100,
      cropWidth: 50,
      cropHeight: 50,
      randomCrop: true,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [
      [0.0, 0.5],
      [0.0, 0.5],
      [0.5, 1.0],
      [0.5, 1.0],
    ];

    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop square from wide rectangle", () => {
    const dims = {
      sampleWidth: 200,
      sampleHeight: 100,
      cropWidth: 100,
      cropHeight: 100,
      randomCrop: true,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [
      [0.0, 0.0],
      [0.0, 0.5],
      [1.0, 1.0],
      [0.5, 1.0],
    ];

    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop square from tall rectangle", () => {
    const dims = {
      sampleWidth: 100,
      sampleHeight: 200,
      cropWidth: 100,
      cropHeight: 100,
      randomCrop: true,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [
      [0.0, 0.5],
      [0.0, 0.0],
      [0.5, 1.0],
      [1.0, 1.0],
    ];

    // console.log(cropCoords);
    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop small wide rectangle from bigger square", () => {
    const dims = {
      sampleWidth: 200,
      sampleHeight: 200,
      cropWidth: 150,
      cropHeight: 100,
      randomCrop: true,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [
      [0.0, 0.5],
      [0.0, 0.66666],
      [0.5, 1.0],
      [0.66666, 1.0],
    ];

    // console.log(cropCoords);
    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop dims same as sample dims", () => {
    const dims = {
      sampleWidth: 100,
      sampleHeight: 100,
      cropWidth: 100,
      cropHeight: 100,
      randomCrop: true,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [
      [0.0, 0.0],
      [0.0, 0.0],
      [1.0, 1.0],
      [1.0, 1.0],
    ];

    // console.log(cropCoords);
    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });
});

describe("matchedCropPad - center", () => {
  it("crop small square from big square", () => {
    const dims = {
      sampleWidth: 100,
      sampleHeight: 100,
      cropWidth: 50,
      cropHeight: 50,
      randomCrop: false,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [0.25, 0.25, 0.75, 0.75];

    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop square from wide rectangle", () => {
    const dims = {
      sampleWidth: 200,
      sampleHeight: 100,
      cropWidth: 100,
      cropHeight: 100,
      randomCrop: false,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [0.0, 0.25, 1.0, 0.75];

    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop square from tall rectangle", () => {
    const dims = {
      sampleWidth: 100,
      sampleHeight: 200,
      cropWidth: 100,
      cropHeight: 100,
      randomCrop: false,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [0.25, 0.0, 0.75, 1.0];

    // console.log(cropCoords);
    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop small wide rectangle from bigger square", () => {
    const dims = {
      sampleWidth: 200,
      sampleHeight: 200,
      cropWidth: 150,
      cropHeight: 100,
      randomCrop: false,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [0.25, 1 / 8, 0.75, 7 / 8];

    // console.log(cropCoords);
    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });

  it("crop dims same as sample dims", () => {
    const dims = {
      sampleWidth: 100,
      sampleHeight: 100,
      cropWidth: 100,
      cropHeight: 100,
      randomCrop: false,
    };

    const cropCoords = matchedCropPad(dims);

    const cropCoordsExpected = [0.0, 0.0, 1.0, 1.0];

    // console.log(cropCoords);
    matchedCropExpectations(dims, cropCoords, cropCoordsExpected);
  });
});
