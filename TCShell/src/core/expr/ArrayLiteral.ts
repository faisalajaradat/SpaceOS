import { ArrayType, BaseType, BaseTypeKind } from "../type/index.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import { getValueOfExpression } from "../../utils.js";
import { Expr } from "./Expr.js";

export class ArrayLiteral extends Expr {
  value: Expr[];

  constructor(line: number, column: number, value: Expr[]) {
    super(
      line,
      column,
      new ArrayType(
        -1,
        -1,
        new BaseType(-1, -1, BaseTypeKind.ANY),
        value.length,
      ),
    );
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.value);
    return children;
  }

  print(): string {
    const arrayNodeId = newNodeId();
    dotString.push(arrayNodeId + '[label=" Array "];\n');
    this.children()
      .map((child) => child.print())
      .forEach((nodeId) => dotString.push(arrayNodeId + "->" + nodeId + ";\n"));
    return arrayNodeId;
  }

  async evaluate(): Promise<unknown[]> {
    const array = new Array<unknown>();
    for (const exp of this.value)
      array.push(getValueOfExpression(await exp.evaluate()));
    return array;
  }
}
