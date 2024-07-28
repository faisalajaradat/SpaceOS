# TCShell Contributing Guide

This guide is created to ease into the project for new developpers. One of TCShell's most important goals
is to have an approachable code base that encourages work from others. All I want is to see TCShell continue 
to grow into the essential tool for AI systems it can be.

The interpreter's architecture can be broken down to five easy steps:

1. Parse into Concrete Syntax Tree (CST) with Ohm.js (`TCShell.ohm`, `grammar.ts`)
2. Traverse CST to generate Abstract Syntax Tree (AST) (`ast.ts`)
3. Traverse AST while performing name analysis (`semantics.ts`)
4. Traverse AST while performing type analysis (`semantics.ts`)
5. Traverse AST while executing each node's behaviour (`core/*`)

## Table of Contents

<table>
<tr><td width=33% valign=top>



</td>
</tr>
</table>