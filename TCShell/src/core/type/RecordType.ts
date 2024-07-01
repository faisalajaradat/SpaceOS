import { ASTNode, dotString, newNodeId } from "../program.js";
import { Type } from "./primitive-types.js";
import { Identifier } from "../expr/Expr.js";
import { isAnyType } from "../../utils.js";

export class RecordType extends Type {
  identifier: Identifier;

  constructor(identifier: Identifier, line: number = -1, column: number = -1) {
    super(line, column);
    this.identifier = identifier;
  }

  children(): ASTNode[] {
    return [this.identifier];
  }

  print(): string {
    const recordTypeNodeId = newNodeId();
    dotString.push(recordTypeNodeId + '[label=" record "];\n');
    const identifierNodeId = this.identifier.print();
    dotString.push(recordTypeNodeId + "->" + identifierNodeId + ";\n");
    return recordTypeNodeId;
  }

  evaluate(): Promise<unknown> {
    return undefined;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof RecordType &&
        this.identifier.value === _type.identifier.value)
    );
  }
}
