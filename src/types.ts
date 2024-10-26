import type { INTERPRETER_MODE } from "./constants";

export type NonEmptyArray<T> = [T, ...T[]];

export type ThueInterpreterOptions = {
  mode: INTERPRETER_MODE;
  maxSteps: number;
};

export type CodeLike = string[];

export type Rule = {
  lhs: string;
  rhs: string;
};

export type ProgramResult = {
  lastState: string;
  outputs: string[];
  nSteps: number;
};

export type StepResult = {
  state: string;
  output: string | undefined;
  hasFinished: boolean;
};
