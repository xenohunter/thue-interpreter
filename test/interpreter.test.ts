import type { ProgramResult } from "../src/types";

import { CAN_BE, DEFAULT_INTERPRETER_OPTIONS, INTERPRETER_MODE } from "../src/constants";
import { getThueInterpreter, ThueInterpreter } from "../src/interpreter";

const DEFAULT_PROGRAM = ["a::=b", "b::=c", "c::=~Hello World!", "::=", "a"];
const DEFAULT_INPUT = [""];
const DEFAULT_EXPECTED_RESULT: ProgramResult = {
  lastState: "",
  outputs: ["Hello World!"],
  nSteps: 4,
};

describe("(Basics) ThueInterpreter", () => {
  it("should be create with the getThueInterpreter function", () => {
    const programAsText = DEFAULT_PROGRAM.join("\n");
    const thue = getThueInterpreter(programAsText, "");
    expect(thue).toBeInstanceOf(ThueInterpreter);
  });

  it("should be instantiable with default values", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    expect(thue).toBeInstanceOf(ThueInterpreter);
  });

  it("should execute the default program and return the expected output", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    const result = thue.run();
    expect(result).toEqual(DEFAULT_EXPECTED_RESULT);
  });

  it("should work in the deterministic mode (with the default program)", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, {
      ...DEFAULT_INTERPRETER_OPTIONS,
      mode: INTERPRETER_MODE.DETERMINISTIC,
    });
    const result = thue.run();
    expect(result).toEqual(DEFAULT_EXPECTED_RESULT);
  });

  it("should work in the probabilistic mode (with the default program)", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, {
      ...DEFAULT_INTERPRETER_OPTIONS,
      mode: INTERPRETER_MODE.PROBABILISTIC,
    });
    const result = thue.run();
    expect(result).toEqual(DEFAULT_EXPECTED_RESULT);
  });
});

describe("(I/O) ThueInterpreter", () => {
  const PROGRAM_WITH_INPUT_COMMAND = ["a::=b", "b::=:::", "::=", "a"];
  const BASIC_INPUT = ["input"]; // Shouldn't contain the letter "b" (as it would be replaced by ":::")

  it("should execute the program with the input command (:::) and return the expected output", () => {
    const thue = new ThueInterpreter(PROGRAM_WITH_INPUT_COMMAND, BASIC_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    const result = thue.run();
    expect(result).toEqual({
      lastState: BASIC_INPUT[0],
      outputs: [],
      nSteps: 3,
    });
  });

  it("should exhaust input and return according results if 2 or more input commands (:::) are provided", () => {
    const recurrentInput = ["b"];
    const thue = new ThueInterpreter(PROGRAM_WITH_INPUT_COMMAND, recurrentInput, DEFAULT_INTERPRETER_OPTIONS);
    const result = thue.run();
    expect(result).toEqual({
      lastState: "b",
      nSteps: 3,
      outputs: ["Error: The input is exhausted"],
    });
  });

  it("should output the expected value given an output command (~)", () => {
    const programWithOutputCommand = ["a::=b", "b::=~OUTPUT", "::=", "a"];
    const thue = new ThueInterpreter(programWithOutputCommand, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    const result = thue.run();
    expect(result).toEqual({
      lastState: "",
      outputs: ["OUTPUT"],
      nSteps: 3,
    });
  });

  it("should ignore all output commands (~) after the first one", () => {
    const programWithOutputCommand = ["a::=b", "b::=~OUTPUT1~OUTPUT2", "::=", "a"];
    const thue = new ThueInterpreter(programWithOutputCommand, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    const result = thue.run();
    expect(result).toEqual({
      lastState: "",
      outputs: ["OUTPUT1~OUTPUT2"],
      nSteps: 3,
    });
  });

  it("should output the current state when given the state output command (~~)", () => {
    const programWithOutputCommand = ["a::=bcd", "b::=~~", "::=", "a"];
    const thue = new ThueInterpreter(programWithOutputCommand, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    const result = thue.run();
    expect(result).toEqual({
      lastState: "cd",
      outputs: ["bcd"],
      nSteps: 3,
    });
  });
});

describe("(State checks) ThueInterpreter", () => {
  it("should have `isRunning` set to false before running the program", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    expect(thue.isRunning).toBe(false);
  });

  it("should have `isRunning` set to true after making a step", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    thue.step();
    expect(thue.isRunning).toBe(true);
  });

  it("should have `isRunning` set to false after running the program", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    thue.run();
    expect(thue.isRunning).toBe(false);
  });

  it("should have `hasFinished` set to true after running the program", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    thue.run();
    expect(thue.hasFinished).toBe(true);
  });

  it("should have the correct internal state after the 1st and 2nd steps", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    thue.step();
    expect(thue.state).toBe("b");
    thue.step();
    expect(thue.state).toBe("c");
  });

  it("should throw at the attempt to make a step after the program has finished", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS);
    thue.run();
    expect(() => thue.step()).toThrow("The program has finished");
  });
});

describe("(Invalid programs) ThueInterpreter", () => {
  const EMPTY_PROGRAM = ["::=", ""];

  it("should throw with an empty array instead of a program", () => {
    expect(() => new ThueInterpreter([], DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS)).toThrow(
      `Missing the ${CAN_BE} operator that divides the rules from the input`,
    );
  });

  it("should throw with an empty program", () => {
    expect(() => new ThueInterpreter(EMPTY_PROGRAM, DEFAULT_INPUT, DEFAULT_INTERPRETER_OPTIONS)).toThrow(
      "Missing the rules",
    );
  });

  it("should throw if the program takes too long to finish", () => {
    const thue = new ThueInterpreter(DEFAULT_PROGRAM, DEFAULT_INPUT, {
      ...DEFAULT_INTERPRETER_OPTIONS,
      maxSteps: 1,
    });
    expect(() => thue.run()).toThrow("The program is taking too long to finish");
  });
});
