import {ASTNode, dotString, newNodeId} from "../program.js";
import {Expr, Identifier} from "./Expr.js";

export class RecordLiteral extends Expr {
  fieldValues: Expr[];

  constructor(
    line: number,
    column: number,
    recordType: Identifier,
    fieldValues: Expr[],
  ) {
    super(line, column, recordType);
    this.fieldValues = fieldValues;
  }

  children(): Array<ASTNode> {
    const children = new Array<ASTNode>();
    children.push(this._type, ...this.fieldValues);
    return children;
  }

  print(): string {
    const recordLiteralNodeId = newNodeId();
    dotString.push(recordLiteralNodeId + '[label=" RecordLiteral "];\n');
    const recordTypeNodeId = this._type.print();
    dotString.push(recordLiteralNodeId + "->" + recordTypeNodeId + ";\n");
    this.fieldValues
      .map((expr) => expr.print())
      .forEach((nodeId) =>
        dotString.push(recordLiteralNodeId + "->" + nodeId + ";\n"),
      );
    return recordLiteralNodeId;
  }

  evaluate(): Promise<unknown> {
    return undefined;
  }
}
