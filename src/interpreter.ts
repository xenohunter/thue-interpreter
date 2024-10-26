import type { CodeLike, NonEmptyArray, ProgramResult, Rule, StepResult, ThueInterpreterOptions } from "./types";

import { DEFAULT_INTERPRETER_OPTIONS, INPUT_REGEX, INTERPRETER_MODE, OUTPUT } from "./constants";
import { ThueError, ThueInputError, ThueRuntimeError, ThueStopSignal } from "./errors";
import { parseThueCode, pickRandom, repeatBasedOnLength } from "./utils";

type RuleFn = (array: NonEmptyArray<Rule>) => Rule;

const RULE_FUNCTIONS: Record<INTERPRETER_MODE, RuleFn> = {
  [INTERPRETER_MODE.CLASSIC]: pickRandom,
  [INTERPRETER_MODE.DETERMINISTIC]: (array) => array[0],
  [INTERPRETER_MODE.PROBABILISTIC]: (array) => pickRandom(repeatBasedOnLength(array)),
};

export class ThueInterpreter {
  #hasStarted = false;
  #hasFinished = false;

  #ruleFn: RuleFn;
  #maxSteps: number;

  #rules: Rule[] = []; // TODO : consider using a trie
  #state: string = "";

  #input: CodeLike = [];
  #inputPointer: number = 0;

  constructor(program: CodeLike, input: CodeLike, options: ThueInterpreterOptions) {
    this.#ruleFn = RULE_FUNCTIONS[options.mode];
    this.#maxSteps = options.maxSteps;

    const [rules, state] = parseThueCode(program);
    this.#rules = rules;
    this.#state = state;

    this.#input = input.filter((line) => line !== ""); // TODO : debatable behavior
    this.#inputPointer = 0;
  }

  get isRunning(): boolean {
    return this.#hasStarted && !this.#hasFinished;
  }

  get hasFinished(): boolean {
    return this.#hasFinished;
  }

  get state(): string {
    return this.#state;
  }

  run(): ProgramResult {
    const outputs = [];
    let nSteps = 0;

    do {
      const { output } = this.step();
      output && outputs.push(output);
      nSteps++;

      if (nSteps > this.#maxSteps) throw new ThueRuntimeError("The program is taking too long to finish");
    } while (!this.#hasFinished);

    return {
      lastState: this.#state,
      outputs: outputs,
      nSteps,
    };
  }

  step(): StepResult {
    if (this.#hasFinished) throw new ThueError("The program has finished");
    this.#hasStarted = true;

    try {
      const { lhs, rhs } = this.#pickRule();

      let finalRhs = rhs;

      // Input resolves before output & there may be multiple ::: in rhs
      const inputMatches = rhs.match(INPUT_REGEX);
      inputMatches &&
        inputMatches.forEach((match) => {
          const input = this.#input[this.#inputPointer++];
          if (input === undefined) {
            throw new ThueInputError("The input is exhausted");
          }
          finalRhs = finalRhs.replace(match, input);
        });

      // Output is optional & only one ~ in rhs is considered
      const outputIndex = finalRhs.indexOf(OUTPUT);
      let output = undefined;
      if (outputIndex !== -1) {
        output = finalRhs.slice(outputIndex + OUTPUT.length);
        if (output === "~") output = this.#state;
        finalRhs = finalRhs.slice(0, outputIndex);
      }

      const nextState = this.#state.replace(lhs, finalRhs);
      this.#state = nextState;

      return {
        state: this.#state,
        output,
        hasFinished: this.#hasFinished,
      };
    } catch (e: any) {
      this.#hasFinished = true;
      return {
        state: this.#state,
        output: e instanceof ThueStopSignal ? undefined : `Error: ${e.message}`,
        hasFinished: this.#hasFinished,
      };
    }
  }

  #pickRule(): Rule {
    const applicableRules = this.#rules.filter(({ lhs }) => this.#state.includes(lhs));
    // TODO : handle empty lhs or employ the following:
    // export type NonEmptyString = string extends "" ? never : string;
    if (applicableRules.length === 0) {
      throw new ThueStopSignal("No applicable rules");
    } else {
      return this.#ruleFn(applicableRules as NonEmptyArray<Rule>);
    }
  }
}

type Options = Partial<ThueInterpreterOptions>;

export function getThueInterpreter(program: string, input: string, options?: Options): ThueInterpreter {
  return new ThueInterpreter(program.split("\n"), input.split("\n"), {
    ...DEFAULT_INTERPRETER_OPTIONS,
    ...options,
  });
}
