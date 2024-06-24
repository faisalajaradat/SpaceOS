import {Scope} from "../semantics.js";
import {popOutOfScopeVars,} from "../utils.js";
import {
  DeferredDecorator,
  Parameter, Stmt,
  VarDeclaration
} from "./stmts.js";
import {Exprs} from "./exprs.js";
//A map variable declaration and their stack of assigned values
export const varStacks = new Map<VarDeclaration | Parameter, unknown[]>();
export const unresolved = [];
export class ArrayRepresentation {
  array: unknown[];
  index: number;

  constructor(array: unknown[], index: number) {
    this.array = array;
    this.index = index;
  }
}

export const dotString = new Array<string>();
let nodeCount = 0;

export const newNodeId = () => "Node" + nodeCount++;

export type SymbolDeclaration = VarDeclaration | Parameter;

export type ExprStmt = Stmt | Exprs;

export type MatchCondition = Parameter | Exprs;

//Define all AST nodes
export interface ASTNode {
  line: number;
  column: number;
  getFilePos(): string;
  children(): ASTNode[];
  //Implement dot printer behaviour for node
  print(): string;
  //Implement tree walker behaviour for node
  evaluate(): Promise<unknown>;
}

export class Program implements ASTNode {
  line: number;
  column: number;
  stmts: ASTNode[];
  scope: Scope;

  constructor(line: number, column: number, stmts: ASTNode[]) {
    this.line = line;
    this.column = column;
    this.stmts = stmts;
  }

  getFilePos(): string {
    return "line: " + this.line + ", column: " + this.column + ", ";
  }

  children(): ASTNode[] {
    const children: ASTNode[] = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }

  print(): string {
    dotString.push("digraph ast {\n");
    const programNodeId = newNodeId();
    dotString.push(programNodeId + '[label=" Program "];\n');
    const declsNodeIds = new Array<string>();
    this.children().forEach((child) => declsNodeIds.push(child.print()));
    declsNodeIds.forEach(
      (nodeId) =>
        (dotString.push(programNodeId + "->" + nodeId + ";\n")),
    );
    dotString.concat("}");
    return programNodeId;
  }

  async evaluate(): Promise<void> {
    for (const stmt of this.children()) {
      if (stmt instanceof DeferredDecorator) unresolved.push(stmt.evaluate());
      else await stmt.evaluate();
    }
    popOutOfScopeVars(this);
    await Promise.all(unresolved);
  }
}

