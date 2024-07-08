import {ASTNode, dotString, newNodeId, RuntimeType, SymbolDeclaration} from "../program.js";
import { getTypeDeclaration, isAnyType } from "../../utils.js";
import { Identifier } from "../expr/Expr.js";

export abstract class Type implements ASTNode {
  line: number;
  column: number;

  abstract children(): ASTNode[];

  abstract print(): string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<unknown> {
    return undefined;
  }

  abstract equals(_type: Type): boolean;

  constructor(line: number, column: number) {
    this.line = line;
    this.column = column;
  }

  getFilePos(): string {
    return "line: " + this.line + ", column: " + this.column + ", ";
  }
}

export enum BaseTypeKind {
  NUMBER,
  STRING,
  BOOL,
  VOID,
  ANY,
  NONE,
}

export const astBaseTypeRuntimeDictionary: { [key in BaseTypeKind]: string } = {
  [BaseTypeKind.NUMBER]: "number",
  [BaseTypeKind.STRING]: "string",
  [BaseTypeKind.BOOL]: "boolean",
  [BaseTypeKind.VOID]: "undefined",
  [BaseTypeKind.ANY]: "undefined",
  [BaseTypeKind.NONE]: "undefined",
};

export class BaseType extends Type {
  kind: BaseTypeKind;

  constructor(kind: BaseTypeKind, line: number = -1, column: number = -1) {
    super(line, column);
    this.kind = kind;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  equals(_type: Type): boolean {
    return (
      this.kind === BaseTypeKind.ANY ||
      (_type instanceof BaseType &&
        (this.kind === _type.kind || _type.kind === BaseTypeKind.ANY))
    );
  }

  print(): string {
    const typeNodeId = newNodeId();
    let label = "";
    switch (this.kind) {
      case BaseTypeKind.NUMBER:
        label = "number";
        break;
      case BaseTypeKind.STRING:
        label = "string";
        break;
      case BaseTypeKind.BOOL:
        label = "bool";
        break;
      case BaseTypeKind.VOID:
        label = "void";
        break;
      case BaseTypeKind.ANY:
        label = "any";
        break;
      case BaseTypeKind.NONE:
        break;
    }
    dotString.push(typeNodeId + '[label=" ' + label + ' "];\n');
    return typeNodeId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<unknown> {
    return astBaseTypeRuntimeDictionary[this.kind];
  }
}

export const DefaultBaseTypeInstance = {
  NUMBER: new BaseType(BaseTypeKind.NUMBER),
  STRING: new BaseType(BaseTypeKind.STRING),
  BOOL: new BaseType(BaseTypeKind.BOOL),
  VOID: new BaseType(BaseTypeKind.VOID),
  ANY: new BaseType(BaseTypeKind.ANY),
  NONE: new BaseType(BaseTypeKind.NONE),
} as const;

export abstract class CompositionType extends Type {
  abstract contains(_type: Type): boolean;
}

export class FunctionType extends Type {
  protected _returnType: RuntimeType;
  protected _paramTypes: RuntimeType[];

  constructor(
    returnType: RuntimeType,
    paramTypes: RuntimeType[],
    line: number = -1,
    column: number = -1,
  ) {
    super(line, column);
    this._returnType = returnType;
    this._paramTypes = paramTypes;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._returnType);
    children.push(...this._paramTypes);
    return children;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof FunctionType &&
        this.returnType.equals(_type.returnType) &&
        this.paramTypes.filter(
          (paramType, pos) => !paramType.equals(_type.paramTypes[pos]),
        ).length === 0)
    );
  }

  print(): string {
    const functionTypeNodeId = newNodeId();
    dotString.push(functionTypeNodeId + '[label=" Function "];\n');
    const typeNodeId = this._returnType.print();
    dotString.push(functionTypeNodeId + "->" + typeNodeId + ";\n");
    this._paramTypes
      .map((paramType) => paramType.print())
      .forEach((nodeId) =>
        dotString.push(functionTypeNodeId + "->" + nodeId + ";\n"),
      );
    return functionTypeNodeId;
  }

  get returnType(): Type {
    if (this._returnType instanceof Identifier)
      return getTypeDeclaration(this._returnType);
    return this._returnType;
  }

  set returnType(_type: RuntimeType) {
    this._returnType = _type;
  }

  get paramTypes(): Type[] {
    return this._paramTypes.map((paramType) =>
      paramType instanceof Identifier
        ? getTypeDeclaration(paramType)
        : paramType,
    );
  }

  set paramTypes(paramTypes: RuntimeType[]) {
    this._paramTypes = paramTypes;
  }
}

export class ArrayType extends Type {
  protected _type: RuntimeType;
  _size: number;

  constructor(
    type: RuntimeType,
    size: number = -1,
    line: number = -1,
    column: number = -1,
  ) {
    super(line, column);
    this._type = type;
    this._size = size;
  }

  children(): ASTNode[] {
    return [this._type];
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof ArrayType && this.type.equals(_type.type))
    );
  }

  print(): string {
    const arrayTypeNodeId = newNodeId();
    dotString.push(arrayTypeNodeId + '[label=" Array Of "];\n');
    const typeNodeId = this._type.print();
    dotString.push(arrayTypeNodeId + "->" + typeNodeId + ";\n");
    return arrayTypeNodeId;
  }

  get type(): Type {
    if (this._type instanceof Identifier) return getTypeDeclaration(this._type);
    return this._type;
  }

  set type(_type: RuntimeType) {
    this._type = _type;
  }
}
