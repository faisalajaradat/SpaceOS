import * as fs from "fs";
import { grammar } from "./grammar.js";
import { ast, visitDotPrinter } from "./ast.js";
import { Command } from "commander";
import { graphviz } from "node-graphviz";

const program = new Command();

program
  .name("TCShell")
  .description("A spatial-oriented scripting language")
  .version("0.2.0");

program
  .command("parse <path>")
  .description("Parse tcs file into AST")
  .option("-t, --trace", "output match trace incase of syntax errors")
  .option("-d, --dot <path>", "save DOT representation of AST to path")
  .action((path, options) => {
    try {
      const input = fs.readFileSync(path, "utf-8");
      const match = grammar.match(input);
      if (match.failed()) {
        const output = options.trace
          ? grammar.trace(input).toString()
          : match.message;
        console.log(output);
        return;
      }
      const astHead = ast(match);
      if (options.dot === undefined) {
        console.log("Success!");
        return;
      }
      const dotString = visitDotPrinter(astHead);
      graphviz
        .dot(dotString, "svg")
        .then((svg) => fs.writeFileSync(options.dot, svg));
    } catch (err) {
      console.error(err);
    }
  })
  .parse();
