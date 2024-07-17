import { isAnyType } from "../../utils.js";
import { ASTNode } from "../program.js";
import { Type } from "./primitive-types.js";

export abstract class FactoryType extends Type {
  protected constructor(line: number, column: number) {
    super(line, column);
  }
}

export class SpacePathGraphFactoryType extends FactoryType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
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
