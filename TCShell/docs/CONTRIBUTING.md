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
interpretation of any user-specified `.tcs` file along with flags for optional behaviour. The CLI is 
implemented using 
[commander.js](https://www.npmjs.com/package/commander). This drastically reduces boiler plate for the CLI, 
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
[TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm), and are loaded in and 
applied within 
[grammar.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/grammar.ts). The lexer and CST parser 
are generated as described within 
[TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm) using 
[Ohm.js](https://www.npmjs.com/package/ohm-js/v/0.10.0). The number one peice to understanding and augmenting
TCShell's grammar is knowing [Ohm.js](https://www.npmjs.com/package/ohm-js/v/0.10.0) front-to-back, so please, 
prior to making any alterations to 
[TCShell.ohm](https://github.com/citelab/spaceOS/blob/main/TCShell/src/TCShell.ohm), read all of 
[Ohm.js's documentation](https://ohmjs.org/docs/intro) and refer to some language implementations in ohm.

## Parser

### AST Nodes

The AST follows an Object-Oriented design to describe it's nodes. All the class and interface 
implementations can be found within [core/](https://github.com/citelab/spaceOS/tree/main/TCShell/src/core).
Though it would be a waste of time describe every single node class, this document will describe the most 
important parent nodes to add context for when you look at the implementations of any of the child node 
classes.

#### ASTNode

Every node in the AST either implement the ASTNode interface directly, or inherit the implementation from a
parent. The unique attribute(s) of an ASTNode are as follows:

1. line: A number that is equal to the line number of the syntax that the node was parsed from. The default 
value of -1 signifies that the node was generated independent of the file being parsed.
2. column: A number that is equalt to the column number on a line of the start of the syntax that the node 
was parsed from. The default value of -1 signifies that the node was generated independent of the file being 
parsed.
3. getFilePos: A method that returns a string describing both the line number and column number of the node.
4. children: A method that returns an array of ASTNodes that are the immediate children to the node in the 
AST.
5. print: A method that appends its generated DOT representation string to the dotString array and returns
its DOT node id.
6. evaluate: An async method that executes the desired behaviour of the 
node, and returns a promise of the result of the behaviour if there is any. 
The method takes in a map of SymbolDeclration to stack to use the runtime 
symbol table.

#### Type

Type is an abstract class that implements ASTNode, but only line, column, getFilePos, and evaluate are 
implemented in Type. The rest of ASTNode is left to be implemented by its children classes. Every node 
meant to be a part of TCShell's type system should extend Type. The unique attribute(s) of a Type are as 
follows:

1. equals: A method that takes another Type as input, and returns true if this type is equivalent to the 
inputted Type.

#### CompositionType

CompositionType is an abstract class that extends Type. Any type that has a subset of types that are not
equal to itself should extend CompositionType. The unique attribute(s) of a CompositionType are as follows:

1. contains: A method that takes another Type as input, and returns true if the inputted type belongs to this 
type.

#### ExprStmt

A TCShell program is made up of a sequence of statements where a statement is either a compound statement or 
an expression. To represent this, there is the defined type ExprStmt which is the union of classes Expr 
and Stmt. Expr and Stmt are both abstract classes that implement ASTNode, but only line, column, and 
getFilePos are implemented in Expr and Stmt. The rest of ASTNode is left to be implemented by theire children 
classes. Every node that is not a Type or the Program node is an ExprStmt. The unique attribute(s) of an 
ExprStmt
are as follows:

1. _type: A RuntimeType that is equal to the type the value represented by the ExprStmt. A RuntimeType can 
either be a Type or an Identifier of a defined type. _type is protected and requires a getter method that is 
in charge of retreiving the Type the Identifier represents.

### AST Generator

The code responsible for generating the AST can be found in 
[ast.ts](https://github.com/citelab/spaceOS/blob/main/TCShell/src/ast.ts). The AST generation is performed 
by creating the [Semantics Object](https://ohmjs.org/docs/api-reference#semantics-objects) `ast`.

## Semantics

### Name Analyzer

todo

### Type Analyzer

todo

## Tree Walker

todo