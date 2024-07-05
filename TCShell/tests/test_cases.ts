import * as fs from "fs";

export const identifier_declaration_test = "var one = 1";
export const keyword_identifier_test = 'var number = "number"';
export const newline_seperated_statements_test =
  'var output = "Right!"\nprint(output)';
export const semicolon_seperated_statements_test =
  'var output = "Right!";print(output)';
export const double_quotes_string_test = "var output = \"'hello'\"";
export const single_quotes_string_test = "var output = 'hello'";
export const while_test =
  'var execute = true\nwhile execute {\n\tprint("Right!")\n\texecute = false\n}';
export const block_test =
  "var iter = 0\nwhile iter < 10 {\nprint(iter)\niter = iter + 1\n}";
export const if_test = 'if true\n\tprint("Right!")';
export const if_else_test = 'if false\n\tprint("Wrong!")\nelse print("Right!")';
export const lor_test =
  'if false || true\n\tprint("Right!")\nelse print("Wrong!")';
export const lar_test =
  'if true && false\n\tprint("Wrong!")\nelse print("Right!")';
export const eq_test =
  'var test = "test"\nif test == "test"\n\tprint("Right!")';
export const neq_test =
  'var test = "test"\nif test != "test"\n\tprint("Wrong!")\nelse print("Right!")';
export const rel_test =
  'var five = 5\nif five < 4\n\tprint("Wrong!")\nelse print("Right!")';
export const add_test = 'print("" + "Right!")';
export const mul_test = 'if 5 * 5 == 25\n\tprint("Right!")';
export const unary_test = 'var no = false\nif !no\n\tprint("Right!")';
export const array_literal_test = "print([1, 2, 3])";
export const function_declaration_test =
  "var concatStringArray = fun (var array, var len) {" +
  '\n\tvar iter = 0\n\tvar fullString = ""\n\twhile iter < len {' +
  "\n\t\tfullString = fullString + array[iter]\n\t\titer = iter + 1\n\t}\n\treturn fullString\n}" +
  '\nprint(concatStringArray(["R", "i", "g", "h", "t", "!"], 6))';
export const array_access_test =
  'var array = ["Wrong!", "Right!", "Wrong!"]\nprint(array[1])';
export const recursion_test = fs.readFileSync(
  "./TCShell/sample_programs/fib.tcs",
  "utf-8",
);
export const first_class_functions_test = fs.readFileSync(
  "./TCShell/sample_programs/first_class.tcs",
  "utf-8",
);
export const pattern_matching_test = fs.readFileSync(
  "./TCShell/sample_programs/maybe_and_either.tcs",
  "utf-8",
);
