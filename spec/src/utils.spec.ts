import { capitalizeText } from "../../build/scripts/funcs.js";
import { formatTime } from "../../build/scripts/utils.js";
import { maxTime } from "../../build/scripts/globals.js";

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

describe("formatTime", () => {
  it("should work for normal times", () => {
    expect(formatTime(1_000)).toEqual("1 second");
    expect(formatTime(2_000)).toEqual("2 seconds");
    expect(formatTime(15_000)).toEqual("15 seconds");
    expect(formatTime(60_000)).toEqual("1 minute");
    expect(formatTime(120_000)).toEqual("2 minutes");
    expect(formatTime(61_000)).toEqual("1 minute, 1 second");
    expect(formatTime(121_000)).toEqual("2 minutes, 1 second");
    expect(formatTime(86400_000)).toEqual("1 day");
  });
  it("should work for infinite times", () => {
    expect(formatTime(maxTime - Date.now())).toEqual("forever");
  });
  it("should work for 0", () => {
    expect(formatTime(0)).toEqual("0 seconds");
  });
});

