import { isAnyType } from '../../utils.js';
import { Identifier } from '../expr/Expr.js';
import {
  ASTNode,
  dotString,
  newNodeId,
} from '../program.js';
import { RecordDeclaration } from '../stmts.js';
import { Type } from './primitive-types.js';

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

  equals(_type: Type): boolean {
    if (isAnyType(_type)) return true;
    if (!(_type instanceof RecordType)) return false;
    const thisFields = (this.identifier.declaration as RecordDeclaration).fields;
    const _typeFields = ((_type as RecordType).identifier.declaration as RecordDeclaration).fields;
    if (thisFields.length !== _typeFields.length)
      return false;
    return thisFields.filter((field, pos) => {
      const otherField = _typeFields[pos];
      return field.identifier.value !== otherField.identifier.value
        || !field.type.equals(otherField.type);
    }).length === 0;
  }
}
