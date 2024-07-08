import {ASTNode, dotString, newNodeId, SymbolDeclaration} from "../program.js";
import { RecordType } from "../type/index.js";
import { Expr, Identifier } from "./Expr.js";
import {getValueOfExpression} from "../../utils.js";

export class RecordLiteral extends Expr {
  fieldValues: Expr[];

  constructor(
    recordType: Identifier,
    fieldValues: Expr[],
    line: number = -1,
    column: number = -1,
  ) {
    super(recordType, line, column);
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

  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<object> {
    const defaultRecord = (await (
      this.type as RecordType
    ).identifier.declaration.evaluate(varStacks)) as object;
    const props = Object.keys(defaultRecord);
    (
      await Promise.all(
        this.fieldValues.map(async (expr) => await expr.evaluate(varStacks)),
      )
    ).map(value => getValueOfExpression(value, varStacks))
        .forEach((value, pos) => (defaultRecord[props[pos]] = value));
    return defaultRecord;
  }
}
