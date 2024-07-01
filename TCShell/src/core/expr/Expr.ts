import { getTypeDeclaration } from "../../utils.js";
import {
  ASTNode,
  dotString,
  newNodeId,
  RuntimeType,
  SymbolDeclaration,
} from "../program.js";
import { BaseType, BaseTypeKind, Type } from "../type/index.js";
import {
  AliasTypeDeclaration,
  ImportDeclaration,
  RecordDeclaration,
  UnionDeclaration,
} from "../stmts.js";

export abstract class Expr implements ASTNode {
  column: number;
  line: number;
  protected _type: RuntimeType;

  protected constructor(exprType: RuntimeType, line: number, column: number) {
    this.column = column;
    this.line = line;
    this._type = exprType;
  }
  abstract children(): Array<ASTNode>;

  abstract print(): string;

  abstract evaluate(): Promise<unknown>;

  getFilePos(): string {
    return "line: " + this.line + ", column: " + this.column + ", ";
  }

  get type(): Type {
    if (this._type instanceof Identifier) return getTypeDeclaration(this._type);
    return this._type;
  }

  set type(_type: RuntimeType) {
    this._type = _type;
  }
}

export class Identifier extends Expr {
  value: string;
  declaration:
    | SymbolDeclaration
    | UnionDeclaration
    | ImportDeclaration
    | RecordDeclaration
    | AliasTypeDeclaration;

  constructor(value: string, line: number = -1, column: number = -1) {
    super(new BaseType(BaseTypeKind.NONE), line, column);
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
