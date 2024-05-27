import { grammar } from "../src/grammar.js";
import * as test_cases from "./test_cases.js";

test("variable declaration", () => {
  expect(
    grammar.match(test_cases.identifier_declaration_test).succeeded(),
  ).toBeTruthy();
});
