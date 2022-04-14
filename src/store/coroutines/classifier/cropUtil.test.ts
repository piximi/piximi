import * as tf from "@tensorflow/tfjs-node";
import { padToMatch } from "./cropUtil";

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

  const profile = await tf.profile(() => padToMatch(sample, 5, 5));
  const result = profile.result as tf.Tensor<tf.Rank.R3>;
  const padded = result.arraySync();

  console.log(`newBytes: ${profile.newBytes}`);
  console.log(`newTensors: ${profile.newTensors}`);

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

  const paddedAgain = padToMatch(result, 5, 5).arraySync();

  expect(padded).toStrictEqual(expected);
  expect(paddedAgain).toStrictEqual(expected);
});
