import * as thuePackage from "../src";

describe("Thue Interpreter package test for index.ts", () => {
  it("should contain the package exports", () => {
    expect(thuePackage).toHaveProperty("ThueInterpreter");
  });
});
