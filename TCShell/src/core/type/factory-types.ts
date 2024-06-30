import {ASTNode, dotString, newNodeId, RuntimeType} from "../program.js";
import {isAnyType} from "../../utils.js";

import {Type} from "./primitive-types.js";

export abstract class FactoryType extends Type {
  protected constructor(line: number, column: number) {
    super(line, column);
  }
}

export class SpaceFactoryType extends FactoryType {
  constructor(line: number, column: number) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spaceFactoryTypeNodeId = newNodeId();
    dotString.push(
      spaceFactoryTypeNodeId + '[label=" Space Factory Type "];\n',
    );
    return spaceFactoryTypeNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpaceFactoryType;
  }
}

export class EntityFactoryType extends FactoryType {
  constructor(line: number, column: number) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const entityFactoryTypeNodeId = newNodeId();
    dotString.push(
      entityFactoryTypeNodeId + '[label=" Entity Factory Type "];\n',
    );
    return entityFactoryTypeNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }

  equals(_type: RuntimeType): boolean {
    return isAnyType(_type) || _type instanceof EntityFactoryType;
  }
}

export class PathFactoryType extends FactoryType {
  constructor(line: number, column: number) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const pathFactoryTypeNodeId = newNodeId();
    dotString.push(pathFactoryTypeNodeId + '[label=" Path Factory Type "];\n');
    return pathFactoryTypeNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }

  equals(_type: RuntimeType): boolean {
    return isAnyType(_type) || _type instanceof PathFactoryType;
  }
}
