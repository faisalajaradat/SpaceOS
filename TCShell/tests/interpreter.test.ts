import { jest } from "@jest/globals";
import * as core from "../src/core/program.js";
import { grammar } from "../src/grammar.js";
import { ast } from "../src/ast.js";
import analyze from "../src/semantics.js";
import * as test_cases from "./test_cases.js";
import { disconnect } from "../../SpatialComputingEngine/src/spatial-computing-engine.js";

async function executeTestCase(testCase: string) {
  const program: core.Program = ast(grammar.match(testCase));
  if (analyze(program) === 0) {
    await program.evaluate();
    await disconnect();
  }
}

test("newline as statement seperator", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.newline_seperated_statements_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

/*test("semicolon as statement seperator", () => {
  const logSpy = jest.spyOn(global.console, "log");
  executeTestCase(test_cases.semicolon_seperated_statements_test);
  expect(logSpy).toHaveBeenCalledWith("Right!");
  logSpy.mockRestore();
});*/

test("while", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.while_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("if", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.if_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("if-else", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.if_else_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("block", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.block_test);
  expect(logSpy).toHaveBeenCalledTimes(10);
  logSpy.mockRestore();
});

test("logical or", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.lor_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("logical and", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.lar_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("equal", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.eq_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("not equal", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.neq_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("less than", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.rel_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("addition", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.add_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("multiplication", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.mul_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("unary", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.unary_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("function declaration", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.function_declaration_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("array access", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.array_access_test);
  expect(logSpy).toHaveBeenLastCalledWith("Right!");
  logSpy.mockRestore();
});

test("recursion", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.recursion_test);
  expect(logSpy).toHaveBeenLastCalledWith(610);
  logSpy.mockRestore();
});

test("first class functions", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.first_class_functions_test);
  expect(logSpy).toHaveBeenCalledTimes(4);
  expect(logSpy).toHaveBeenLastCalledWith(4);
  logSpy.mockRestore();
});

test("pattern match", async () => {
  const logSpy = jest.spyOn(global.console, "log");
  await executeTestCase(test_cases.pattern_matching_test);
  expect(logSpy).toHaveBeenCalledTimes(34);
  expect(logSpy).toHaveBeenLastCalledWith(64);
  logSpy.mockRestore();
});
