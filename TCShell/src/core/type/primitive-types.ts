import { ASTNode, dotString, newNodeId } from "../program.js";
import { isAnyType } from "../../utils.js";

export abstract class Type implements ASTNode {
  line: number;
  column: number;

  abstract children(): ASTNode[];

  abstract print(): string;

  abstract evaluate(): Promise<unknown>;

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
  [BaseTypeKind.NONE]: "undefined,",
};

export class BaseType extends Type {
  kind: BaseTypeKind;

  constructor(line: number, column: number, kind: BaseTypeKind) {
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
      case BaseTypeKind.NONE:
        break;
    }
    dotString.push(typeNodeId + '[label=" ' + label + ' "];\n');
    return typeNodeId;
  }

  async evaluate(): Promise<string> {
    return astBaseTypeRuntimeDictionary[this.kind];
  }
}

export const DefaultBaseTypeInstance = {
  NUMBER: new BaseType(-1, -1, BaseTypeKind.NUMBER),
  STRING: new BaseType(-1, -1, BaseTypeKind.STRING),
  BOOL: new BaseType(-1, -1, BaseTypeKind.BOOL),
  VOID: new BaseType(-1, -1, BaseTypeKind.VOID),
  ANY: new BaseType(-1, -1, BaseTypeKind.ANY),
  NONE: new BaseType(-1, -1, BaseTypeKind.NONE),
} as const;

export abstract class CompositionType extends Type {
  abstract contains(_type: Type): boolean;
}

export class FunctionType extends Type {
  returnType: Type;
  paramTypes: Type[];

  constructor(
    line: number,
    column: number,
    returnType: Type,
    paramTypes: Type[],
  ) {
    super(line, column);
    this.returnType = returnType;
    this.paramTypes = paramTypes;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.returnType);
    children.push(...this.paramTypes);
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
    const typeNodeId = this.returnType.print();
    dotString.push(functionTypeNodeId + "->" + typeNodeId + ";\n");
    this.paramTypes
      .map((paramType) => paramType.print())
      .forEach((nodeId) =>
        dotString.push(functionTypeNodeId + "->" + nodeId + ";\n"),
      );
    return functionTypeNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }
}

export class ArrayType extends Type {
  _type: Type;
  _size: number;

  constructor(line: number, column: number, type: Type, size: number) {
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
      (_type instanceof ArrayType && this._type.equals(_type._type))
    );
  }

  print(): string {
    const arrayTypeNodeId = newNodeId();
    dotString.push(arrayTypeNodeId + '[label=" Array Of "];\n');
    const typeNodeId = this._type;
    dotString.push(arrayTypeNodeId + "->" + typeNodeId + ";\n");
    return arrayTypeNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }
}
