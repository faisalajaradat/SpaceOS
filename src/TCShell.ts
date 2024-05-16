import * as fs from "fs";
import { grammar } from "./grammar.js";
import { ast, visitDotPrinter } from "./ast.js";
import { Command } from "commander";
import path from "path";

const program = new Command();

program
  .name("TCShell")
  .description("A spatial-oriented scripting language")
  .version("0.2.0");

program
  .command("match")
  .description("Match a tcs file")
  .argument("<path>", "path to file")
  .option("-t, --trace", "display trace information incase of error")
  .action((path, options) => {
    try {
      const input = fs.readFileSync(path, "utf-8");
      if (options.trace) {
        console.log(grammar.trace(input).toString());
        return;
      }
      const output = grammar.match(input).succeeded() ? "Success!" : "Failure!";
      console.log(output);
    } catch (err) {
      console.error(err);
    }
  })
  .command("parse")
  .description("Parse tcs file into AST")
  .argument("<path>", "path to file")
  .option("-d, --dot", "print dot representation of AST")
  .action((path, options) => {
    try {
      const input = fs.readFileSync(path, "utf-8");
      const match = grammar.match(input);
      if (match.failed()) {
        console.log("Failure!");
        return;
      }
      const astHead = ast(match);
      if (!options.dot) {
        console.log(astHead);
        return;
      }
      console.log(visitDotPrinter(astHead));
    } catch (err) {
      console.error(err);
    }
  })
  .parse();
