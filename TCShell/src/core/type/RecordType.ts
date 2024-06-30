import {ASTNode, dotString, newNodeId} from "../program.js";
import {Type} from "./primitive-types.js";
import {Identifier} from "../expr/Expr.js";

export class RecordType extends Type {
  identifier: Identifier;

  constructor(line: number, column: number, identifier: Identifier) {
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
      _type instanceof RecordType &&
      this.identifier.value === _type.identifier.value
    );
  }
}
