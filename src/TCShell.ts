import * as fs from "fs";
import { grammar } from "./grammar.js";
import ast from "./ast.js";
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
  .action((path, option) => {
    try {
      const input = fs.readFileSync(path, "utf-8");
      if (option.trace) {
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
  .action((path) => {
    try {
      const input = fs.readFileSync(path, "utf-8");
      const match = grammar.match(input);
      console.log(match.succeeded() ? ast(match) : match.message);
    } catch (err) {
      console.error(err);
    }
  })
  .parse();
