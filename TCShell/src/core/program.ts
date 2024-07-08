import { Scope } from "../semantics.js";
import { popOutOfScopeVars } from "../utils.js";
import {
  Block,
  CaseStmt,
  DeferDecorator,
  If,
  Parameter,
  Stmt,
  VarDeclaration,
  While,
} from "./stmts.js";
import { Expr, Identifier } from "./expr/Expr.js";
import { BinaryExpr } from "./expr/index.js";
import { Type } from "./type/index.js";
import { FunDeclaration } from "./expr/index.js";
//A map variable declaration and their stack of assigned values
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

export type ExprStmt = Stmt | Expr;

export type MatchCondition = Parameter | Expr;

export type ControlFlowStmt = If | While;

export type Assignment = VarDeclaration | BinaryExpr;

export type RuntimeType = Type | Identifier;

export type Location = { x: number; y: number };

export type SPGStruct = { root: string; table: Map<string, string[]> };

export type ScopedNode =
  | Program
  | FunDeclaration
  | Block
  | CaseStmt
  | DeferDecorator;

export function jsonReplacer(key, value) {
  if (value instanceof Map) return { dataType: "Map", value: [...value] };
  return value;
}

export function jsonReviver(key, value) {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") return new Map(value.value);
  }
  return value;
}

//Define all AST nodes
export interface ASTNode {
  line: number;
  column: number;
  getFilePos(): string;
  children(): ASTNode[];
  //Implement dot printer behaviour for node
  print(): string;
  //Implement tree walker behaviour for node
  evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<unknown>;
}

export class Program implements ASTNode {
  line: number;
  column: number;
  stmts: ASTNode[];
  scope: Scope;
  libStmts: ASTNode[];

  constructor(line: number, column: number, stmts: ASTNode[]) {
    this.line = line;
    this.column = column;
    this.stmts = stmts;
    this.libStmts = new Array<ASTNode>();
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
    declsNodeIds.forEach((nodeId) =>
      dotString.push(programNodeId + "->" + nodeId + ";\n"),
    );
    dotString.push("}");
    return programNodeId;
  }

  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<void> {
    for (const stmt of [...this.libStmts, ...this.children()]) {
      if (stmt instanceof DeferDecorator) unresolved.push(stmt.evaluate(varStacks));
      else await stmt.evaluate(varStacks);
    }
    popOutOfScopeVars(this, varStacks);
    await Promise.all(unresolved);
  }
}
