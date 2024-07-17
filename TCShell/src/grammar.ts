import * as ohm from "ohm-js";
import * as fs from "fs";
import {fileURLToPath} from "url";
import {dirname} from "path";

const grammarFile = fs.readFileSync(
  dirname(fileURLToPath(import.meta.url)) + "/TCShell.ohm",
  "utf-8",
);
//Loads and exports TCShell grammar
export const grammar = ohm.grammar(grammarFile);
