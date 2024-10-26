import { parseThueCode } from "../src/utils";

describe("parseThueCode", () => {
  it("should remove comments and empty lines", () => {
    const code = ["a::=b", "", "b::=d  # non-deterministic!", "::=", "a", ""];
    const [rules, state] = parseThueCode(code);
    expect(rules).toEqual([
      { lhs: "a", rhs: "b" },
      { lhs: "b", rhs: "d" },
    ]);
    expect(state).toEqual("a");
  });

  it("should throw an error if a rule line has no ::= delimiter", () => {
    const code = ["abc", "::=", "a"];
    expect(() => parseThueCode(code)).toThrow("Invalid line 1: missing ::= in abc");
  });

  it("should throw an error if a rule line has more than one ::= delimiter", () => {
    const code = ["a::=b::=c", "::=", "a"];
    expect(() => parseThueCode(code)).toThrow("Invalid line 1: too many ::= in a::=b::=c");
  });

  it("should throw an error if there are no rules", () => {
    const code = ["::=", "a"];
    expect(() => parseThueCode(code)).toThrow("Missing the rules");
  });

  it("should throw an error if there is no initial state or it is an empty string", () => {
    expect(() => parseThueCode(["a::=b", "::="])).toThrow("Missing the initial state");
    expect(() => parseThueCode(["a::=b", "::=", ""])).toThrow("Missing the initial state");
  });

  it("should throw an error if there are are more than one lines for the initial state", () => {
    const code = ["a::=b", "::=", "a", "b"];
    expect(() => parseThueCode(code)).toThrow("Too many initial state lines");
  });
});
