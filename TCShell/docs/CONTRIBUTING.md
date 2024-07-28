# TCShell Contributing Guide

This guide is created to ease into the project for new developpers. One of TCShell's most important goals
is to have an approachable code base that encourages work from others. All I want is to see TCShell continue 
to grow into the essential tool for AI systems it can be.

The code for the interpreter can be found in [src/](https://github.com/citelab/spaceOS/tree/main/TCShell/src).

The interpreter's architecture can be broken down to five easy steps:

1. Parse into Concrete Syntax Tree (CST) with Ohm.js 
([TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm),
 [grammar.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/grammar.ts))
2. Traverse CST to generate Abstract Syntax Tree (AST) 
([ast.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/ast.ts))
3. Traverse AST while performing name analysis 
([semantics.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/semantics.ts))
4. Traverse AST while performing type analysis 
([semantics.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/semantics.ts))
5. Traverse AST while executing each node's behaviour 
([core/*](https://github.com/citelab/spaceOS/tree/main/TCShell/src/core))

## Table of Contents

<table>
<tr><td width=33% valign=top>

* [CLI](#cli)
* [Grammar](#grammar)
* [Parser](#parser)
    * [AST Nodes](#ast-nodes)
    * [AST Generator](#ast-generator)
* [Semantics](#semantics)
    * [Name Analyzer](#name-analyzer)
    * [Type Analyzer](#type-analyzer)
* [Tree Walker](#tree-walker)

</td>
</tr>
</table>

## CLI

The entrypoint of the program is the CLI in 
[TCShell.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ts). TCShell's CLI enables the 
interpretation of any user-specified `.tcs` file along with flags for optional behaviour. The CLI is implemented 
using [commander.js](https://www.npmjs.com/package/commander). This drastically reduces boiler plate for the CLI, 
and provides a scalable framework for future flags and commands. There is only one command to the CLI, and it 
executes the steps in order defined above.

Excute the following command to see how to use the CLI and how each flag works:

```
node . --help
```

The existing options implemented show give a good example on how to add new ones, but if more information is need, 
please refer to [commander.js's documentation](https://github.com/tj/commander.js/blob/master/Readme.md) as 
it makes it very clear how to augment this CLI.

## Grammar

TCShell's grammar rules are defined in 
[TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm), and are loaded in and applied 
within [grammar.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/grammar.ts). The lexer and CST parser 
are generated as described within 
[TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm) using 
[ohm.js](https://www.npmjs.com/package/ohm-js/v/0.10.0). The number one peice to understanding and augmenting
TCShell's grammar is knowing [ohm.js](https://www.npmjs.com/package/ohm-js/v/0.10.0) front-to-back, so please, 
prior to making any alterations to 
[TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm), read all of 
[ohm.js's documentation](https://ohmjs.org/docs/intro) and refer to some language implementations in ohm.

## Parser

### AST Nodes

todo

### AST Generator

todo

## Semantics

### Name Analyzer

todo

### Type Analyzer

todo

## Tree Walker

todo