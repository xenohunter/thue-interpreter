import { CAN_BE } from "./constants";
import { ThueSyntaxError } from "./errors";
import type { CodeLike, NonEmptyArray, Rule } from "./types";

export const parseThueCode = (code: CodeLike): [Rule[], string] => {
  const dividingLineIndex = code.findIndex((line) => line === CAN_BE);
  if (dividingLineIndex === -1) {
    throw new ThueSyntaxError(`Missing the ${CAN_BE} operator that divides the rules from the input`);
  }

  const rules = code
    .slice(0, dividingLineIndex)
    .map((line) => {
      const commentIndex = line.indexOf("#");
      if (commentIndex !== -1) {
        line = line.slice(0, commentIndex);
      }
      return line.trim();
    })
    .filter((line) => line !== "")
    .map((line, index): Rule => {
      if (!line.includes(CAN_BE)) {
        throw new ThueSyntaxError(`Invalid line ${index + 1}: missing ${CAN_BE} in ${line}`);
      }

      const pair = line.split(CAN_BE);
      if (pair.length !== 2) {
        throw new ThueSyntaxError(`Invalid line ${index + 1}: too many ${CAN_BE} in ${line}`);
      }

      const [lhs, rhs] = pair as [string, string];

      // TODO : make sure OUTPUT is single

      return { lhs, rhs };
    });

  if (rules.length === 0) {
    throw new ThueSyntaxError("Missing the rules");
  }

  const state = code.slice(dividingLineIndex + 1).filter((line) => line !== "");

  if (!state[0]) {
    throw new ThueSyntaxError("Missing the initial state"); // TODO : should work for empty state
  } else if (state.length > 1) {
    throw new ThueSyntaxError("Too many initial state lines");
  }

  return [rules, state[0]];
};

export const repeatBasedOnLength = (array: NonEmptyArray<Rule>): NonEmptyArray<Rule> => {
  const repeated = array.reduce((arr, rule) => {
    // Repeat the rule as many times as the length of its `lhs`
    arr.push(...Array(rule.lhs.length).fill(rule));
    return arr;
  }, [] as Rule[]);

  return repeated as NonEmptyArray<Rule>;
};

export const pickRandom = <T extends any>(array: NonEmptyArray<T>): T => {
  const value = array[Math.floor(Math.random() * array.length)];
  return value as T;
};
