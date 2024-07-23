import { isAnyType } from "../../utils.js";
import { Identifier } from "../expr/Expr.js";
import { ASTNode } from "../program.js";
import { createSPG, getFactoryJSON } from "../spg-factory-methods.js";
import { libDeclarations } from "../stmts.js";
import { UnionType } from "./UnionType.js";
import {
  DefaultBaseTypeInstance,
  FunctionType,
  Type,
} from "./primitive-types.js";

export abstract class FactoryType extends Type {
  protected constructor(line: number, column: number) {
    super(line, column);
  }
}

export class SpacePathGraphFactoryType extends FactoryType {
  static libMethods: Map<string, (...args: unknown[]) => Promise<unknown>>;

  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  static {
    SpacePathGraphFactoryType.libMethods = new Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >();
    SpacePathGraphFactoryType.libMethods.set("createSPG", createSPG);
    SpacePathGraphFactoryType.libMethods.set("getFactoryJSON", getFactoryJSON);
  }

  static mapMethodNameToMethodType(methodName): FunctionType {
    const spacePathGraphOrStringType = new UnionType(
      new Identifier("SpacePathGraphOrString"),
    );
    spacePathGraphOrStringType.identifier.declaration = libDeclarations[7];
    switch (methodName) {
      case "createSPG":
        return new FunctionType(spacePathGraphOrStringType, []);
      case "getFactoryJSON":
        return new FunctionType(DefaultBaseTypeInstance.STRING, []);
    }
  }

  children(): ASTNode[] {
    return [];
  }

  print(): string {
    return undefined;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpacePathGraphFactoryType;
  }
}
