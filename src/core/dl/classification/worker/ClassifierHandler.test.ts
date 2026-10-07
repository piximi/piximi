import { describe, it, expect } from "vitest";

import { ClassifierHandler } from "./ClassifierHandler";

describe("ClassifierHandler (worker class, instantiated directly)", () => {
  it("starts empty", async () => {
    const h = new ClassifierHandler("cpu");
    expect(await h.getModelNames()).toEqual({ success: true, data: [] });
    expect(await h.hasModel("anything")).toEqual({
      success: true,
      data: false,
    });
  });

  it("getModelInfo returns MODEL_NOT_FOUND for unknown model", async () => {
    const h = new ClassifierHandler("cpu");
    const result = await h.getModelInfo("nope");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason.code).toBe("MODEL_NOT_FOUND");
  });
});
