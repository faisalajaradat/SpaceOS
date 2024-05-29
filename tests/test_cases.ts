export const identifier_declaration_test = "number one = 1";
export const keyword_identifier_test = 'string number = "number"';
export const newline_seperated_statements_test =
  'string output = "Right!"\nprint(output)';
export const semicolon_seperated_statements_test =
  'string output = "Right!";print(output)';
export const double_quotes_string_test = "string output = \"'hello'\"";
export const single_quotes_string_test = "string output = 'hello'";
export const while_test =
  'bool execute = true\nwhile execute {\n\tprint("Right!")\n\texecute = false\n}';
export const block_test =
  "number iter = 0\nwhile iter < 10 {\nprint(iter)\niter = iter + 1\n}";
export const if_test = 'if true\n\tprint("Right!")';
export const if_else_test = 'if false\n\tprint("Wrong!")\nelse print("Right!")';
export const lor_test =
  'if false || true\n\tprint("Right!")\nelse print("Wrong!")';
export const lar_test =
  'if true && false\n\tprint("Wrong!")\nelse print("Right!")';
export const eq_test =
  'string test = "test"\nif test == "test"\n\tprint("Right!")';
export const neq_test =
  'string test = "test"\nif test != "test"\n\tprint("Wrong!")\nelse print("Right!")';
export const rel_test =
  'number five = 5\nif five < 4\n\tprint("Wrong!")\nelse print("Right!")';
export const add_test = 'print("" + "Right!")';
export const mul_test = 'if 5 * 5 == 25\n\tprint("Right!")';
export const unary_test = 'bool no = false\nif !no\n\tprint("Right!")';
export const array_literal_test = "print({1, 2, 3})";
export const function_declaration_test =
  "string concatStringArray(string[] array, number len) {" +
  '\n\tnumber iter = 0\n\tstring fullString = ""\n\twhile iter < len {' +
  "\n\t\tfullString = fullString + array[iter]\n\t\titer = iter + 1\n\t}\n\treturn fullString\n}" +
  '\nprint(concatStringArray({"R", "i", "g", "h", "t", "!"}, 6))';
export const array_access_test =
  'string[] array = {"Wrong!", "Right!", "Wrong!"}\nprint(array[1])';
