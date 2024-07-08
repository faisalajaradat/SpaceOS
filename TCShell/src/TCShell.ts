import * as fs from "fs";
import * as core from "./core/program.js";
import { grammar } from "./grammar.js";
import { ast } from "./ast.js";
import { Command } from "commander";
import { graphviz } from "node-graphviz";
import analyze from "./semantics.js";
import { disconnect } from "../../SpatialComputingEngine/src/spatial-computing-engine.js";
import {SymbolDeclaration} from "./core/program.js";
//Entrypoint and CLI for using TCShell interpreter

const program = new Command();

program
  .name("TCShell")
  .description("A spatial-oriented scripting language")
  .version("0.2.0");

program
  .command("interpret <path>")
  .description("interpret tcs files")
  .option("-t, --trace", "output match trace in case of syntax errors")
  .option("-d, --dot <path>", "save DOT representation of AST to path")
  .option(
    "-i, --inference_test <path>",
    "save DOT of pre and post type analysis",
  )
  .action(async (path, options) => {
    try {
      const input = fs.readFileSync(path, "utf-8");
      const match = grammar.match(input);
      if (match.failed()) {
        const output = options.trace
          ? grammar.trace(input).toString()
          : match.message;
        console.log(output);
        await disconnect();
        return;
      }
      const astHead: core.Program = ast(match);
      if (options.inference_test !== undefined) {
        astHead.print();
        const preDot = core.dotString.join("");
        core.dotString.length = 0;
        graphviz
          .dot(preDot, "svg")
          .then((svg) =>
            fs.writeFileSync(options.inference_test.concat("_pre.svg"), svg),
          );
        const semanticsErrors = analyze(astHead);
        if (!semanticsErrors) {
          astHead.print();
          const postDot = core.dotString.join("");
          graphviz
            .dot(postDot, "svg")
            .then((svg) =>
              fs.writeFileSync(options.inference_test.concat("_post.svg"), svg),
            );
        } else console.log("Program has " + semanticsErrors + " error(s)!");
        await disconnect();
        return;
      }
      if (options.dot !== undefined) {
        astHead.print();
        const dotProg = core.dotString.join("");
        graphviz
          .dot(dotProg, "svg")
          .then((svg) => fs.writeFileSync(options.dot, svg));
      }
      const semanticsErrors = analyze(astHead);
      if (semanticsErrors) {
        console.error("Program has " + semanticsErrors + " error(s)!");
        await disconnect();
        return;
      }
      await astHead.evaluate(new Map<SymbolDeclaration, unknown[]>);
      await disconnect();
    } catch (err) {
      console.error(err);
      await disconnect();
    }
  })
  .parse();
