import { ASTNode, dotString, newNodeId } from "../program.js";
import { RecordType } from "../type/RecordType.js";
import { Expr, Identifier } from "./Expr.js";

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

  async evaluate(): Promise<object> {
    const defaultRecord = (await (
      this.type as RecordType
    ).identifier.declaration.evaluate()) as object;
    const props = Object.keys(defaultRecord);
    (
      await Promise.all(
        this.fieldValues.map(async (expr) => await expr.evaluate()),
      )
    ).forEach((value, pos) => (defaultRecord[props[pos]] = value));
    return defaultRecord;
  }
}
