import { AClockworkOrange } from "./fixtures/book";

describe("Entity utils", () => {
  describe(`selectIdValue()`, () => {
    const OLD_ENV = import.meta.env;

    beforeEach(() => {
      jest.resetModules(); // this is important - it clears the cache
      import.meta.env = { ...OLD_ENV, NODE_ENV: "development" };
    });

    afterEach(() => {
      import.meta.env = OLD_ENV;
      jest.resetAllMocks();
    });

    it("should not warn when key does exist", () => {
      const { selectIdValue } = require("../utils");
      const spy = jest.spyOn(console, "warn");

      selectIdValue(AClockworkOrange, (book: any) => book.id);
      expect(spy).not.toHaveBeenCalled();
    });

    it("should warn when key does not exist in dev mode", () => {
      const { selectIdValue } = require("../utils");
      const spy = jest.spyOn(console, "warn");

      selectIdValue(AClockworkOrange, (book: any) => book.foo);

      expect(spy).toHaveBeenCalled();
    });

    it("should warn when key is undefined in dev mode", () => {
      const { selectIdValue } = require("../utils");
      const spy = jest.spyOn(console, "warn");

      const undefinedAClockworkOrange = { ...AClockworkOrange, id: undefined };
      selectIdValue(undefinedAClockworkOrange, (book: any) => book.id);

      expect(spy).toHaveBeenCalled();
    });

    // it("should not warn when key does not exist in prod mode", () => {
    //   import.meta.env.NODE_ENV = "production";
    //   const { selectIdValue } = require("../utils");
    //   const spy = jest.spyOn(console, "warn");

    //   selectIdValue(AClockworkOrange, (book: any) => book.foo);

    //   expect(spy).not.toHaveBeenCalled();
    // });

    // it("should not warn when key is undefined in prod mode", () => {
    //   import.meta.env.NODE_ENV = "production";
    //   const { selectIdValue } = require("../utils");
    //   const spy = jest.spyOn(console, "warn");

    //   const undefinedAClockworkOrange = { ...AClockworkOrange, id: undefined };
    //   selectIdValue(undefinedAClockworkOrange, (book: any) => book.id);

    //   expect(spy).not.toHaveBeenCalled();
    // });
  });
});
