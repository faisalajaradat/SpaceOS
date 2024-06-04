import { jest } from "@jest/globals";
import * as core from "../src/core.js";
import { grammar } from "../src/grammar.js";
import { ast } from "../src/ast.js";
import analyze from "../src/semantics.js";
import * as test_cases from "./test_cases.js";

function executeTestCase(testCase: string) {
  const program: core.Program = ast(grammar.match(testCase));
  if (analyze(program) === 0) program.evaluate();
}

test("newline as statement seperator", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.newline_seperated_statements_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

/*test("semicolon as statement seperator", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.semicolon_seperated_statements_test);
  expect(logSpy).toHaveBeenCalledWith("Right!");
  logSpy.mockRestore();
});*/

test("while", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.while_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("if", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.if_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("if-else", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.if_else_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("block", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.block_test);
  expect(logSpy).toHaveBeenCalledTimes(10);
  logSpy.mockRestore();
});

test("logical or", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.lor_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("logical and", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.lar_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("equal", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.eq_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("not equal", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.neq_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("less than", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.rel_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("addition", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.add_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("multiplication", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.mul_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("unary", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.unary_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("function declaration", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.function_declaration_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("array access", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.array_access_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});
