import * as ohm from "ohm-js";
import * as fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";

const grammarFile = fs.readFileSync(
  dirname(fileURLToPath(import.meta.url)) + "/TCShell.ohm",
  "utf-8",
);
const grammar = ohm.grammar(grammarFile);
const program = new Command();

program
  .name("TCShell")
  .description("A spatial-oriented scripting language")
  .version("0.1.0");

program
  .command("parse")
  .description("Parse a tcs file")
  .argument("<path>", "path to file to parse")
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
  .parse();
