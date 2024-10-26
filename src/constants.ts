import type { ThueInterpreterOptions } from "./types";

export const CAN_BE = "::=";
export const INPUT = ":::";
export const OUTPUT = "~";

export const INPUT_REGEX: RegExp = new RegExp(INPUT, "g");

export enum INTERPRETER_MODE {
  CLASSIC = "classic",
  DETERMINISTIC = "deterministic",
  PROBABILISTIC = "probabilistic",
}

export const DEFAULT_INTERPRETER_OPTIONS: ThueInterpreterOptions = {
  mode: INTERPRETER_MODE.CLASSIC,
  maxSteps: 10000,
};
