import { capitalizeText } from "../../build/scripts/funcs.js";

describe("capitalizeText", () => {
  it("should work", () => {
    expect(capitalizeText("hello")).toEqual("Hello");
    expect(capitalizeText("Hello")).toEqual("Hello");
    expect(capitalizeText("HELLO")).toEqual("Hello");
    expect(capitalizeText("hEllO")).toEqual("Hello");
    expect(capitalizeText("fish community")).toEqual("Fish Community");
    expect(capitalizeText("fish community is nice")).toEqual("Fish Community is Nice");
    expect(capitalizeText("the fish community")).toEqual("The Fish Community");
  });
});

