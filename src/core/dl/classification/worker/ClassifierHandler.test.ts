import { describe, it, expect } from "vitest";

import { ClassifierHandler } from "./ClassifierHandler";

describe("ClassifierHandler (worker class, instantiated directly)", () => {
  it("starts empty", () => {
    const h = new ClassifierHandler("cpu");
    expect(h.getModelNames()).toEqual([]);
    expect(h.hasModel("anything")).toBe(false);
  });

  it("getModelInfo returns undefined for unknown model", () => {
    const h = new ClassifierHandler("cpu");
    expect(h.getModelInfo("nope")).toBeUndefined();
  });
});
