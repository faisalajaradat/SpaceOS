import {
  ASTNode,
  dotString,
  newNodeId,
  SymbolDeclaration,
} from "../program.js";
import { ImportDeclaration, UnionDeclaration } from "../stmts.js";
import { BaseType, BaseTypeKind } from "../type/index.js";
import { Expr } from "./Expr.js";

export class Identifier extends Expr {
  value: string;
  declaration: SymbolDeclaration | UnionDeclaration | ImportDeclaration;

  constructor(line: number, column: number, value: string) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const identifierNodeId = newNodeId();
    dotString.push(identifierNodeId + '[label=" ' + this.value + ' "];\n');
    return identifierNodeId;
  }

  async evaluate(): Promise<Identifier> {
    return this;
  }
}
