# TCShell Contributing Guide

This guide is created to ease into the project for new developpers. One of TCShell's most important goals
is to have an approachable code base that encourages work from others. All I want is to see TCShell continue 
to grow into the essential tool for AI systems it can be.

The code for the interpreter can be found in `src/`.

The interpreter's architecture can be broken down to five easy steps:

1. Parse into Concrete Syntax Tree (CST) with Ohm.js (`TCShell.ohm`, `grammar.ts`)
2. Traverse CST to generate Abstract Syntax Tree (AST) (`ast.ts`)
3. Traverse AST while performing name analysis (`semantics.ts`)
4. Traverse AST while performing type analysis (`semantics.ts`)
5. Traverse AST while executing each node's behaviour (`core/*`)

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

The entrypoint of the program is the CLI in `TCShell.ts`. TCShell's CLI enables the interpretation of any 
user-specified `.tcs` file along with flags for optional behaviour. The CLI is implemented using 
`commander.js`. This drastically reduces boiler plate for the CLI, and provides a scalable framework for future
flags and commands. Excute the following command to see how each 

## Grammar

todo

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